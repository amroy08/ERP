export interface DeviceTokenRegisterPayload {
  token: string;
  deviceType: 'ios' | 'android' | 'web';
  platform?: string;
  appVersion?: string;
}

// Placeholder types & constants for future notification preferences UI
export const NOTIFICATION_PREFERENCES = {
  ATTENDANCE: 'attendance',
  HOMEWORK: 'homework',
  FEES: 'fees',
  NOTICES: 'notices',
  EXAMS: 'exams',
  RESULTS: 'results',
} as const;

export type NotificationPreferenceType = typeof NOTIFICATION_PREFERENCES[keyof typeof NOTIFICATION_PREFERENCES];

export interface TimetableEntryItem {
  period: string;
  startTime: string;
  endTime: string;
  className: string;
  sectionName: string;
  subjectName: string;
}

export interface NoticeItem {
  id: string;
  title: string;
  publishDate: string;
  priority: string;
}

export interface HomeworkItem {
  id: string;
  title: string;
  description?: string;
  subjectName: string;
  assignedDate: string;
  dueDate: string;
  status: string;
  submissionStatus?: string | null;
  submittedAt?: string | null;
  hasSubmission?: boolean;
  fileName?: string | null;
  teacherFeedback?: string | null;
  marks?: number | null;
  canSubmit?: boolean;
  canResubmit?: boolean;
}

export type StudentHomeworkSubmission = {
  id?: string;
  homeworkId: string;
  studentId?: string;
  status?: string;
  submissionText?: string | null;
  fileName?: string | null;
  mimeType?: string | null;
  fileSize?: number | null;
  submittedAt?: string | null;
  teacherFeedback?: string | null;
  marks?: number | null;
  reviewedAt?: string | null;
  canResubmit?: boolean;
};


export interface ExamScheduleItem {
  id: string;
  title: string;
  subjectName: string;
  date: string;
  startTime?: string;
  totalMarks: number;
}

export interface ExamResultItem {
  id: string;
  examTitle: string;
  subjectName: string;
  marksObtained: number;
  totalMarks: number;
  grade?: string;
  percentage?: number;
  status: string;
}

export type TeacherHomeworkItem = {
  homeworkId: string;
  title: string;
  description?: string | null;
  className?: string | null;
  sectionName?: string | null;
  subjectName?: string | null;
  dueDate?: string | null;
  createdAt?: string | null;
  totalStudents?: number;
  submittedCount?: number;
  pendingCount?: number;
  reviewedCount?: number;
  lateCount?: number;
};

export type TeacherHomeworkSubmissionListItem = {
  submissionId?: string | null;
  studentId: string;
  studentName: string;
  rollNo?: string | null;
  admissionNo?: string | null;
  status: "pending" | "submitted" | "late" | "reviewed" | "returned" | string;
  submittedAt?: string | null;
  fileName?: string | null;
  hasFile?: boolean;
  hasText?: boolean;
  marks?: number | null;
  teacherFeedback?: string | null;
  reviewedAt?: string | null;
};

export type TeacherHomeworkSubmissionDetail = {
  submissionId: string;
  homeworkId: string;
  homeworkTitle?: string | null;
  studentName?: string;
  studentId?: string;
  submissionText?: string | null;
  fileName?: string | null;
  mimeType?: string | null;
  fileSize?: number | null;
  status?: string;
  submittedAt?: string | null;
  teacherFeedback?: string | null;
  marks?: number | null;
  reviewedAt?: string | null;
  canReview?: boolean;
  canReturn?: boolean;
  canDownload?: boolean;
};

// ─── Teacher Marks Entry ───────────────────────────────────────────────────
export type TeacherMarksExam = {
  examId: string;
  examName: string;
  classId?: string;
  className?: string;
  sectionId?: string | null;
  sectionName?: string | null;
  examDate?: string | null;
  status?: string;
  totalSubjects?: number;
  marksEnteredCount?: number;
  totalStudents?: number;
  publishedStatus?: string | null;
};

export type TeacherMarksSubject = {
  subjectId: string;
  subjectName: string;
  className?: string;
  sectionName?: string | null;
  maxMarks?: number;
  marksEnteredCount?: number;
  totalStudents?: number;
};

export type TeacherMarksStudent = {
  studentId: string;
  studentName: string;
  rollNo?: string | null;
  admissionNo?: string | null;
  existingResultId?: string | null;
  marksObtained?: number | null;
  maxMarks?: number | null;
  grade?: string | null;
  remarks?: string | null;
  status?: string | null;
};

export type SaveMarksPayload = {
  subjectId: string;
  maxMarks: number;
  marks: Array<{
    studentId: string;
    marksObtained: number;
    remarks?: string;
  }>;
};

