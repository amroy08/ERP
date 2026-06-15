import { Router } from 'express';
import { protect } from '../middleware/authMiddleware';
import { homeworkSubmissionUpload } from '../middleware/uploadMiddleware';
import {
  registerDevice,
  unregisterDevice,
  getParentDashboard,
  getParentStudentProfile,
  getParentAttendance,
  getParentFees,
  getParentNotices,
  getParentChildTimetable,
  getParentChildHomework,
  getParentChildExams,
  getParentChildResults,
  getStudentDashboard,
  getStudentTimetable,
  getStudentHomework,
  getStudentExams,
  getStudentResults,
  getStudentHomeworkSubmission,
  submitStudentHomework,
  getTeacherDashboard,
  getTeacherTimetable,
  getTeacherNotices,
  getTeacherAttendanceClasses,
  getTeacherAttendanceStudents,
  submitTeacherAttendance,
  // Phase 3.1F — Teacher Homework Review
  getTeacherHomework,
  getTeacherHomeworkSubmissions,
  getTeacherSubmissionDetail,
  reviewTeacherSubmission,
  downloadTeacherSubmissionFile,
  // Phase 3.1I — Teacher Marks Entry
  getTeacherMarksExams,
  getTeacherMarksExamSubjects,
  getTeacherMarksExamStudents,
  saveTeacherMarks,
} from '../controllers/mobileController';

const router = Router();

// Apply auth middleware to protect all mobile routes
router.use(protect);

// ── Device token ─────────────────────────────────────────────
router.post('/devices/register', registerDevice);
router.post('/devices/unregister', unregisterDevice);

// ── Parent ────────────────────────────────────────────────────
router.get('/parent/dashboard', getParentDashboard);
router.get('/parent/student-profile/:studentId', getParentStudentProfile);
router.get('/parent/attendance', getParentAttendance);
router.get('/parent/fees', getParentFees);
router.get('/parent/notices', getParentNotices);
router.get('/parent/student/:studentId/timetable', getParentChildTimetable);
router.get('/parent/student/:studentId/homework', getParentChildHomework);
router.get('/parent/student/:studentId/exams', getParentChildExams);
router.get('/parent/student/:studentId/results', getParentChildResults);

// ── Student ───────────────────────────────────────────────────
router.get('/student/dashboard', getStudentDashboard);
router.get('/student/timetable', getStudentTimetable);
router.get('/student/homework', getStudentHomework);
router.get('/student/exams', getStudentExams);
router.get('/student/results', getStudentResults);
router.get('/student/homework/:homeworkId/submission', getStudentHomeworkSubmission);
router.post('/student/homework/:homeworkId/submit', homeworkSubmissionUpload.single('file'), submitStudentHomework);

// ── Teacher ───────────────────────────────────────────────────
router.get('/teacher/dashboard', getTeacherDashboard);
router.get('/teacher/timetable', getTeacherTimetable);
router.get('/teacher/notices', getTeacherNotices);
router.get('/teacher/attendance-classes', getTeacherAttendanceClasses);
router.get('/teacher/attendance-students', getTeacherAttendanceStudents);
router.post('/teacher/attendance-submit', submitTeacherAttendance);

// Phase 3.1F — Teacher Homework Review
// IMPORTANT: specific paths must come before param paths to avoid route conflicts
router.get('/teacher/homework/submissions/:submissionId/download', downloadTeacherSubmissionFile);
router.get('/teacher/homework/submissions/:submissionId', getTeacherSubmissionDetail);
router.patch('/teacher/homework/submissions/:submissionId/review', reviewTeacherSubmission);
router.get('/teacher/homework/:homeworkId/submissions', getTeacherHomeworkSubmissions);
router.get('/teacher/homework', getTeacherHomework);

// Phase 3.1I — Teacher Marks Entry
router.get('/teacher/marks/exams', getTeacherMarksExams);
router.get('/teacher/marks/exams/:examId/subjects', getTeacherMarksExamSubjects);
router.get('/teacher/marks/exams/:examId/students', getTeacherMarksExamStudents);
router.post('/teacher/marks/exams/:examId/save', saveTeacherMarks);

export default router;

