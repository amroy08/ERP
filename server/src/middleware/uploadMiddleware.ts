import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { Request } from 'express';

// Ensure upload directories exist
const uploadDirs = ['uploads', 'uploads/notices', 'uploads/exams', 'uploads/homework'];
uploadDirs.forEach(dir => {
  const fullPath = path.join(process.cwd(), dir);
  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true });
  }
});

// Storage configuration
const storage = multer.diskStorage({
  destination: (req: Request, file, cb) => {
    let dest = 'uploads/';
    if (req.originalUrl.includes('notices')) dest += 'notices';
    else if (req.originalUrl.includes('exams')) dest += 'exams';
    else if (req.originalUrl.includes('homework')) dest += 'homework';
    
    cb(null, dest);
  },
  filename: (req: Request, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// File filter (only PDFs for non-image uploads, or images)
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (file.mimetype === 'application/pdf' || file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only PDF and images are allowed.'));
  }
};

export const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  }
});

// ── Admission Document Upload (Private Storage) ──────────────────────────
// Stored in private_uploads/admissions/ — NOT served via express.static

const admissionUploadDir = path.join(process.cwd(), 'private_uploads', 'admissions');
if (!fs.existsSync(admissionUploadDir)) {
  fs.mkdirSync(admissionUploadDir, { recursive: true });
}

const ALLOWED_ADMISSION_MIMES = [
  'application/pdf',
  'image/jpeg',
  'image/png'
];

const ALLOWED_ADMISSION_EXTENSIONS = ['.pdf', '.jpg', '.jpeg', '.png'];

const admissionStorage = multer.diskStorage({
  destination: (_req: Request, _file, cb) => {
    cb(null, admissionUploadDir);
  },
  filename: (req: Request, file, cb) => {
    const docType = req.params.documentType || 'doc';
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${docType}-${uniqueSuffix}${ext}`);
  }
});

const admissionFileFilter = (_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (ALLOWED_ADMISSION_MIMES.includes(file.mimetype) && ALLOWED_ADMISSION_EXTENSIONS.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only PDF, JPG, JPEG, and PNG files are allowed for admission documents.'));
  }
};

export const admissionUpload = multer({
  storage: admissionStorage,
  fileFilter: admissionFileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  }
});
