import { Router } from 'express';
import {
  getTeachers, getTeacher, createTeacher, updateTeacher, deleteTeacher, resetTeacherPassword,
  getStaff, getStaffMember, createStaff, updateStaff, deleteStaff, resetStaffPassword,
  getParents, deleteParent,
  getNotices, createNotice, updateNotice, deleteNotice,
  getEnquiries, createEnquiry, updateEnquiry,
  getAdmissions, getAdmission, createAdmission, updateAdmission, convertAdmissionToStudent,
  getClasses, createClass, updateClass, deleteClass,
  getSubjects, createSubject, updateSubject, deleteSubject,
  getAttendance, markAttendance, getStudentAttendanceReport,
  getSchoolSettings, updateSchoolSettings,
  getAcademicYears, createAcademicYear, updateAcademicYear,
  getSections, getSection, createSection, updateSection, deleteSection,
  getHomework, createHomework,
  getTimetables, createTimetable
} from '../controllers/moduleController';
import { upload } from '../middleware/uploadMiddleware';
import {
  getBooks, createBook, issueBook, returnBook, getIssueHistory
} from '../controllers/libraryController';
import {
  getItems, createItem, recordTransaction, getTransactions
} from '../controllers/inventoryController';
import {
  getExams, createExam, submitMarks, getReportCard, getExamSubjects, getExamMarks
} from '../controllers/examController';
import { protect } from '../middleware/authMiddleware';
import { authorize } from '../middleware/rbacMiddleware';
import { PERMISSIONS } from '../config/constants';
import { validateRequest } from '../middleware/validateMiddleware';
import { convertAdmissionSchema } from '../validation/schemas';
import { checkModuleEnabled } from '../middleware/moduleMiddleware';

const router = Router();

// Teachers
router.get('/teachers', protect, authorize(PERMISSIONS.TEACHER_VIEW), getTeachers);
router.get('/teachers/:id', protect, authorize(PERMISSIONS.TEACHER_VIEW), getTeacher);
router.post('/teachers', protect, authorize(PERMISSIONS.TEACHER_CREATE), createTeacher);
router.put('/teachers/:id', protect, authorize(PERMISSIONS.TEACHER_UPDATE), updateTeacher);
router.delete('/teachers/:id', protect, authorize(PERMISSIONS.TEACHER_DELETE), deleteTeacher);
router.post('/teachers/:id/reset-password', protect, authorize(PERMISSIONS.TEACHER_UPDATE), resetTeacherPassword);

// Staff
router.get('/staff', protect, authorize(PERMISSIONS.STAFF_VIEW), getStaff);
router.get('/staff/:id', protect, authorize(PERMISSIONS.STAFF_VIEW), getStaffMember);
router.post('/staff', protect, authorize(PERMISSIONS.STAFF_CREATE), createStaff);
router.put('/staff/:id', protect, authorize(PERMISSIONS.STAFF_UPDATE), updateStaff);
router.delete('/staff/:id', protect, authorize(PERMISSIONS.STAFF_DELETE), deleteStaff);
router.post('/staff/:id/reset-password', protect, authorize(PERMISSIONS.STAFF_UPDATE), resetStaffPassword);

// Parents
router.get('/parents', protect, authorize(PERMISSIONS.STUDENT_VIEW), getParents);
router.delete('/parents/:id', protect, authorize(PERMISSIONS.STUDENT_DELETE), deleteParent);

// Notices
router.get('/notices', protect, checkModuleEnabled('notices'), authorize(PERMISSIONS.NOTICE_VIEW), getNotices);
router.post('/notices', protect, checkModuleEnabled('notices'), authorize(PERMISSIONS.NOTICE_CREATE), upload.single('file'), createNotice);
router.put('/notices/:id', protect, checkModuleEnabled('notices'), authorize(PERMISSIONS.NOTICE_UPDATE), upload.single('file'), updateNotice);
router.delete('/notices/:id', protect, checkModuleEnabled('notices'), authorize(PERMISSIONS.NOTICE_DELETE), deleteNotice);

// Enquiries
router.get('/enquiries', protect, authorize(PERMISSIONS.ENQUIRY_VIEW), getEnquiries);
router.post('/enquiries', protect, authorize(PERMISSIONS.ENQUIRY_CREATE), createEnquiry);
router.put('/enquiries/:id', protect, authorize(PERMISSIONS.ENQUIRY_UPDATE), updateEnquiry);

// Admissions
router.get('/admissions', protect, authorize(PERMISSIONS.ADMISSION_VIEW), getAdmissions);
router.get('/admissions/:id', protect, authorize(PERMISSIONS.ADMISSION_VIEW), getAdmission);
router.post('/admissions', protect, authorize(PERMISSIONS.ADMISSION_CREATE), createAdmission);
router.put('/admissions/:id', protect, authorize(PERMISSIONS.ADMISSION_UPDATE), updateAdmission);
router.post('/admissions/convert/:id', protect, authorize(PERMISSIONS.ADMISSION_APPROVE), validateRequest(convertAdmissionSchema), convertAdmissionToStudent);

// Classes
router.get('/classes', protect, authorize(PERMISSIONS.CLASS_VIEW), getClasses);
router.post('/classes', protect, authorize(PERMISSIONS.CLASS_CREATE), createClass);
router.put('/classes/:id', protect, authorize(PERMISSIONS.CLASS_UPDATE), updateClass);
router.delete('/classes/:id', protect, authorize(PERMISSIONS.CLASS_DELETE), deleteClass);

// Subjects
router.get('/subjects', protect, authorize(PERMISSIONS.CLASS_VIEW), getSubjects);
router.post('/subjects', protect, authorize(PERMISSIONS.CLASS_CREATE), createSubject);
router.put('/subjects/:id', protect, authorize(PERMISSIONS.CLASS_UPDATE), updateSubject);
router.delete('/subjects/:id', protect, authorize(PERMISSIONS.CLASS_DELETE), deleteSubject);

// Attendance
router.get('/attendance', protect, checkModuleEnabled('attendance'), authorize(PERMISSIONS.ATTENDANCE_VIEW), getAttendance);
router.post('/attendance/bulk', protect, checkModuleEnabled('attendance'), authorize(PERMISSIONS.ATTENDANCE_MARK), markAttendance);
router.get('/attendance/report/:studentId', protect, checkModuleEnabled('attendance'), authorize(PERMISSIONS.ATTENDANCE_VIEW), getStudentAttendanceReport);

// School Settings
router.get('/school', protect, getSchoolSettings);
router.put('/school', protect, authorize(PERMISSIONS.SETTINGS_UPDATE), updateSchoolSettings);

// Academic Years
router.get('/academic-years', protect, authorize(PERMISSIONS.SETTINGS_VIEW), getAcademicYears);
router.post('/academic-years', protect, authorize(PERMISSIONS.SETTINGS_UPDATE), createAcademicYear);
router.put('/academic-years/:id', protect, authorize(PERMISSIONS.SETTINGS_UPDATE), updateAcademicYear);

// Sections
router.get('/sections', protect, authorize(PERMISSIONS.CLASS_VIEW), getSections);
router.get('/sections/:id', protect, authorize(PERMISSIONS.CLASS_VIEW), getSection);
router.post('/sections', protect, authorize(PERMISSIONS.CLASS_CREATE), createSection);
router.put('/sections/:id', protect, authorize(PERMISSIONS.CLASS_UPDATE), updateSection);
router.delete('/sections/:id', protect, authorize(PERMISSIONS.CLASS_DELETE), deleteSection);

// Homework
router.get('/homework', protect, checkModuleEnabled('homework'), authorize(PERMISSIONS.HOMEWORK_VIEW), getHomework);
router.post('/homework', protect, checkModuleEnabled('homework'), authorize(PERMISSIONS.HOMEWORK_CREATE), createHomework);

// Timetable
router.get('/timetables', protect, checkModuleEnabled('timetable'), authorize(PERMISSIONS.TIMETABLE_VIEW), getTimetables);
router.post('/timetables', protect, checkModuleEnabled('timetable'), authorize(PERMISSIONS.TIMETABLE_MANAGE), createTimetable);

// Library
router.get('/library/books', protect, checkModuleEnabled('library'), authorize(PERMISSIONS.LIBRARY_VIEW), getBooks);
router.post('/library/books', protect, checkModuleEnabled('library'), authorize(PERMISSIONS.LIBRARY_MANAGE), createBook);
router.post('/library/issue', protect, checkModuleEnabled('library'), authorize(PERMISSIONS.LIBRARY_MANAGE), issueBook);
router.post('/library/return/:id', protect, checkModuleEnabled('library'), authorize(PERMISSIONS.LIBRARY_MANAGE), returnBook);
router.get('/library/history', protect, checkModuleEnabled('library'), authorize(PERMISSIONS.LIBRARY_VIEW), getIssueHistory);

// Inventory
router.get('/inventory/items', protect, checkModuleEnabled('inventory'), authorize(PERMISSIONS.INVENTORY_VIEW), getItems);
router.post('/inventory/items', protect, checkModuleEnabled('inventory'), authorize(PERMISSIONS.INVENTORY_MANAGE), createItem);
router.post('/inventory/transaction', protect, checkModuleEnabled('inventory'), authorize(PERMISSIONS.INVENTORY_MANAGE), recordTransaction);
router.get('/inventory/history', protect, checkModuleEnabled('inventory'), authorize(PERMISSIONS.INVENTORY_VIEW), getTransactions);

// Exams
router.get('/exams', protect, authorize(PERMISSIONS.EXAM_VIEW), getExams);
router.post('/exams', protect, authorize(PERMISSIONS.EXAM_CREATE), createExam);
router.post('/exams/marks', protect, authorize(PERMISSIONS.EXAM_MARKS_ENTRY), submitMarks);
router.get('/exams/marks/:examId/:subjectId', protect, authorize(PERMISSIONS.EXAM_MARKS_ENTRY, PERMISSIONS.EXAM_VIEW), getExamMarks);
router.get('/exams/subjects/:examId', protect, authorize(PERMISSIONS.EXAM_MARKS_ENTRY, PERMISSIONS.EXAM_VIEW), getExamSubjects);
router.get('/exams/report/:studentId', protect, authorize(PERMISSIONS.EXAM_VIEW), getReportCard);

export default router;
