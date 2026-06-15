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

// ── Student Document Upload (Private Storage) ──────────────────────────
// Stored in private_uploads/students/ — NOT served via express.static

const studentUploadDir = path.join(process.cwd(), 'private_uploads', 'students');
if (!fs.existsSync(studentUploadDir)) {
  fs.mkdirSync(studentUploadDir, { recursive: true });
}

const ALLOWED_STUDENT_MIMES = [
  'application/pdf',
  'image/jpeg',
  'image/png'
];

const ALLOWED_STUDENT_EXTENSIONS = ['.pdf', '.jpg', '.jpeg', '.png'];

const studentStorage = multer.diskStorage({
  destination: (_req: Request, _file, cb) => {
    cb(null, studentUploadDir);
  },
  filename: (req: Request, file, cb) => {
    const docType = req.params.documentType || 'doc';
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${docType}-${uniqueSuffix}${ext}`);
  }
});

const studentFileFilter = (_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (ALLOWED_STUDENT_MIMES.includes(file.mimetype) && ALLOWED_STUDENT_EXTENSIONS.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only PDF, JPG, JPEG, and PNG files are allowed for student documents.'));
  }
};

export const studentUpload = multer({
  storage: studentStorage,
  fileFilter: studentFileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  }
});

// ── Homework Submission Upload (Private Storage) ──────────────────────────
// Stored in private_uploads/homework-submissions/ — NOT served via express.static

const homeworkSubmissionUploadDir = path.join(process.cwd(), 'private_uploads', 'homework-submissions');
if (!fs.existsSync(homeworkSubmissionUploadDir)) {
  fs.mkdirSync(homeworkSubmissionUploadDir, { recursive: true });
}

const ALLOWED_HOMEWORK_MIMES = [
  'application/pdf',
  'application/msword', // doc
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // docx
  'image/jpeg',
  'image/png',
  'text/plain' // txt
];

const ALLOWED_HOMEWORK_EXTENSIONS = ['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png', '.txt'];

const homeworkStorage = multer.diskStorage({
  destination: (_req: Request, _file, cb) => {
    cb(null, homeworkSubmissionUploadDir);
  },
  filename: (req: Request, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `submission-${uniqueSuffix}${ext}`);
  }
});

const homeworkFileFilter = (_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (ALLOWED_HOMEWORK_MIMES.includes(file.mimetype) || ALLOWED_HOMEWORK_EXTENSIONS.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only PDF, DOC, DOCX, JPG, JPEG, PNG, and TXT files are allowed for homework submissions.'));
  }
};

export const homeworkSubmissionUpload = multer({
  storage: homeworkStorage,
  fileFilter: homeworkFileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  }
});
