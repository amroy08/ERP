import { Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import { AuthRequest } from '../middleware/authMiddleware';
import prisma from '../config/prisma';
import { getSchoolScope } from '../utils/schoolScope';
import { createError } from '../middleware/errorHandler';

// ── Allowed Document Types ──────────────────────────────────────────────
const ALLOWED_DOCUMENT_TYPES = [
  'studentPhoto',
  'birthCertificateDoc',
  'studentAadhaarDoc',
  'parentAadhaarDoc',
  'transferCertificateDoc',
  'previousMarksCardDoc'
] as const;

type StudentDocumentType = typeof ALLOWED_DOCUMENT_TYPES[number];

const PRIVATE_UPLOAD_ROOT = path.resolve(process.cwd(), 'private_uploads', 'students');

// Ensure the directory exists
if (!fs.existsSync(PRIVATE_UPLOAD_ROOT)) {
  fs.mkdirSync(PRIVATE_UPLOAD_ROOT, { recursive: true });
}

// ── Helpers ─────────────────────────────────────────────────────────────

function isAllowedDocumentType(type: string): type is StudentDocumentType {
  return ALLOWED_DOCUMENT_TYPES.includes(type as StudentDocumentType);
}

/**
 * Safely resolve a file path and ensure it stays within the private upload root.
 * Returns null if the path would escape the root (path traversal attack).
 */
function resolveSafeFilePath(relativePath: string): string | null {
  const resolved = path.resolve(PRIVATE_UPLOAD_ROOT, path.basename(relativePath));
  if (!resolved.startsWith(PRIVATE_UPLOAD_ROOT)) {
    return null;
  }
  return resolved;
}

/**
 * Delete a file safely, swallowing errors if the file doesn't exist.
 */
function safeDeleteFile(filePath: string): void {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (err) {
    console.error(`[StudentDocs] Failed to delete file ${filePath}:`, err);
  }
}

/**
 * Get content type from file extension.
 */
function getContentType(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  switch (ext) {
    case '.pdf': return 'application/pdf';
    case '.jpg':
    case '.jpeg': return 'image/jpeg';
    case '.png': return 'image/png';
    default: return 'application/octet-stream';
  }
}

/**
 * Look up student by ID scoped to the user's school.
 */
async function getSchoolScopedStudent(req: AuthRequest, studentId: string) {
  return prisma.student.findFirst({
    where: { id: studentId, ...getSchoolScope(req) }
  });
}

// ── Upload Student Document ─────────────────────────────────────────────
export const uploadStudentDocument = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = req.params.id as string;
    const documentType = req.params.documentType as string;

    // Validate documentType
    if (!isAllowedDocumentType(documentType)) {
      next(createError(`Invalid document type '${documentType}'. Allowed: ${ALLOWED_DOCUMENT_TYPES.join(', ')}`, 400));
      return;
    }

    // Validate file exists
    if (!req.file) {
      next(createError('No file uploaded. Please send a file with field name "file".', 400));
      return;
    }

    // Verify student exists and belongs to user's school
    const student = await getSchoolScopedStudent(req, id);
    if (!student) {
      safeDeleteFile(req.file.path);
      next(createError('Student not found or access denied.', 404));
      return;
    }

    // Save path in db
    const oldFilePath = (student as any)[documentType];
    const relativeFileName = path.basename(req.file.path);

    await prisma.student.update({
      where: { id: student.id },
      data: { [documentType]: relativeFileName }
    });

    // Delete old file if present
    if (oldFilePath) {
      const absoluteOldPath = resolveSafeFilePath(oldFilePath);
      if (absoluteOldPath) {
        safeDeleteFile(absoluteOldPath);
      }
    }

    res.json({
      success: true,
      data: {
        studentId: student.id,
        documentType,
        fileName: req.file.filename,
        mimeType: req.file.mimetype,
        size: req.file.size,
        downloadUrl: `/api/students/${student.id}/documents/${documentType}`,
        updatedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    if (req.file) {
      safeDeleteFile(req.file.path);
    }
    next(error);
  }
};

// ── Download Student Document ───────────────────────────────────────────
export const downloadStudentDocument = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = req.params.id as string;
    const documentType = req.params.documentType as string;

    // Validate documentType
    if (!isAllowedDocumentType(documentType)) {
      next(createError(`Invalid document type '${documentType}'. Allowed: ${ALLOWED_DOCUMENT_TYPES.join(', ')}`, 400));
      return;
    }

    // Verify student exists and belongs to user's school
    const student = await getSchoolScopedStudent(req, id);
    if (!student) {
      next(createError('Student not found or access denied.', 404));
      return;
    }

    // RBAC: Students and parents scoping
    const authUser = req.user!;
    if (authUser.role === 'student' && student.userId !== authUser.id) {
      return next(createError('Access denied. You can only view your own documents.', 403));
    }
    if (authUser.role === 'parent') {
      const parent = await prisma.parent.findUnique({
        where: { userId: authUser.id },
        include: { children: { select: { id: true } } }
      });
      if (!parent || !parent.children.some(child => child.id === student.id)) {
        return next(createError('Access denied. This student is not linked to your account.', 403));
      }
    }

    // Get file reference
    const relativePath = (student as any)[documentType];
    if (!relativePath) {
      next(createError(`Document '${documentType}' has not been uploaded for this student.`, 404));
      return;
    }

    // Resolve safe path
    const absolutePath = resolveSafeFilePath(relativePath);
    if (!absolutePath || !fs.existsSync(absolutePath)) {
      next(createError('File not found on disk.', 404));
      return;
    }

    // Send file
    const contentType = getContentType(absolutePath);
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `inline; filename="${path.basename(absolutePath)}"`);

    const stream = fs.createReadStream(absolutePath);
    stream.pipe(res);
  } catch (error) {
    next(error);
  }
};

// ── Delete Student Document ─────────────────────────────────────────────
export const deleteStudentDocument = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = req.params.id as string;
    const documentType = req.params.documentType as string;

    // Validate documentType
    if (!isAllowedDocumentType(documentType)) {
      next(createError(`Invalid document type '${documentType}'. Allowed: ${ALLOWED_DOCUMENT_TYPES.join(', ')}`, 400));
      return;
    }

    // Verify student exists and belongs to user's school
    const student = await getSchoolScopedStudent(req, id);
    if (!student) {
      next(createError('Student not found or access denied.', 404));
      return;
    }

    const relativePath = (student as any)[documentType];
    if (!relativePath) {
      res.json({ success: true, message: 'Document already deleted.' });
      return;
    }

    // Clear db reference
    await prisma.student.update({
      where: { id: student.id },
      data: { [documentType]: null }
    });

    // Clear file from disk
    const absolutePath = resolveSafeFilePath(relativePath);
    if (absolutePath) {
      safeDeleteFile(absolutePath);
    }

    res.json({ success: true, message: 'Document deleted successfully.' });
  } catch (error) {
    next(error);
  }
};
