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

type AdmissionDocumentType = typeof ALLOWED_DOCUMENT_TYPES[number];

const PRIVATE_UPLOAD_ROOT = path.resolve(process.cwd(), 'private_uploads', 'admissions');

// ── Helpers ─────────────────────────────────────────────────────────────

function isAllowedDocumentType(type: string): type is AdmissionDocumentType {
  return ALLOWED_DOCUMENT_TYPES.includes(type as AdmissionDocumentType);
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
    console.error(`[AdmissionDocs] Failed to delete file ${filePath}:`, err);
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
 * Look up admission by ID scoped to the user's school.
 */
async function getSchoolScopedAdmission(req: AuthRequest, admissionId: string) {
  return prisma.admission.findFirst({
    where: { id: admissionId, ...getSchoolScope(req) }
  });
}

// ── Upload Admission Document ───────────────────────────────────────────
export const uploadAdmissionDocument = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
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

    // Verify admission exists and belongs to user's school
    const admission = await getSchoolScopedAdmission(req, id);
    if (!admission) {
      // Clean up the uploaded file since we're rejecting the request
      safeDeleteFile(req.file.path);
      next(createError('Admission not found or access denied.', 404));
      return;
    }

    // Delete old file if one exists for this document type
    const oldPath = (admission as any)[documentType] as string | null;
    if (oldPath) {
      const oldResolved = resolveSafeFilePath(oldPath);
      if (oldResolved) {
        safeDeleteFile(oldResolved);
      }
    }

    // Store relative filename only (not full path)
    const relativeFileName = path.basename(req.file.path);

    // Update admission record with the new document path
    await prisma.admission.update({
      where: { id },
      data: { [documentType]: relativeFileName }
    });

    res.status(200).json({
      success: true,
      data: {
        admissionId: id,
        documentType,
        fileName: relativeFileName,
        originalName: req.file.originalname,
        mimeType: req.file.mimetype,
        size: req.file.size,
        downloadUrl: `/api/admissions/${id}/documents/${documentType}`,
        updatedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    // Clean up uploaded file on unexpected error
    if (req.file) {
      safeDeleteFile(req.file.path);
    }
    next(error);
  }
};

// ── Delete Admission Document ───────────────────────────────────────────
export const deleteAdmissionDocument = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = req.params.id as string;
    const documentType = req.params.documentType as string;

    // Validate documentType
    if (!isAllowedDocumentType(documentType)) {
      next(createError(`Invalid document type '${documentType}'. Allowed: ${ALLOWED_DOCUMENT_TYPES.join(', ')}`, 400));
      return;
    }

    // Verify admission exists and belongs to user's school
    const admission = await getSchoolScopedAdmission(req, id);
    if (!admission) {
      next(createError('Admission not found or access denied.', 404));
      return;
    }

    const currentPath = (admission as any)[documentType] as string | null;
    if (!currentPath) {
      res.status(200).json({
        success: true,
        message: `No ${documentType} document to remove.`,
        data: { admissionId: id, documentType, deleted: false }
      });
      return;
    }

    // Delete the file from disk
    const resolved = resolveSafeFilePath(currentPath);
    if (resolved) {
      safeDeleteFile(resolved);
    }

    // Clear the field in DB
    await prisma.admission.update({
      where: { id },
      data: { [documentType]: null }
    });

    res.status(200).json({
      success: true,
      message: `${documentType} document removed successfully.`,
      data: { admissionId: id, documentType, deleted: true }
    });
  } catch (error) {
    next(error);
  }
};

// ── Download / View Admission Document ──────────────────────────────────
export const downloadAdmissionDocument = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = req.params.id as string;
    const documentType = req.params.documentType as string;

    // Validate documentType
    if (!isAllowedDocumentType(documentType)) {
      next(createError(`Invalid document type '${documentType}'. Allowed: ${ALLOWED_DOCUMENT_TYPES.join(', ')}`, 400));
      return;
    }

    // Verify admission exists and belongs to user's school
    const admission = await getSchoolScopedAdmission(req, id);
    if (!admission) {
      next(createError('Admission not found or access denied.', 404));
      return;
    }

    const storedFileName = (admission as any)[documentType] as string | null;
    if (!storedFileName) {
      next(createError(`No ${documentType} document uploaded for this admission.`, 404));
      return;
    }

    // Safely resolve the file path
    const resolvedPath = resolveSafeFilePath(storedFileName);
    if (!resolvedPath) {
      next(createError('Invalid document path.', 400));
      return;
    }

    // Verify file exists on disk
    if (!fs.existsSync(resolvedPath)) {
      next(createError('Document file not found on server. It may have been moved or deleted.', 404));
      return;
    }

    // Stream the file with correct headers
    const contentType = getContentType(resolvedPath);
    const safeDisplayName = `${documentType}-${id}${path.extname(resolvedPath)}`;

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `inline; filename="${safeDisplayName}"`);
    res.setHeader('Cache-Control', 'private, max-age=3600');

    const readStream = fs.createReadStream(resolvedPath);
    readStream.pipe(res);

    readStream.on('error', (err) => {
      console.error('[AdmissionDocs] Stream error:', err);
      if (!res.headersSent) {
        next(createError('Error reading document file.', 500));
      }
    });
  } catch (error) {
    next(error);
  }
};
