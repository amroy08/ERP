import apiClient from './apiClient';

// ─── Push Notifications ────────────────────────────────────────────────────
export const registerPushToken = async (
  token: string,
  deviceType: 'ios' | 'android' | 'web',
  platform?: string,
  appVersion?: string
) => {
  const response = await apiClient.post('/mobile/devices/register', {
    token, deviceType, platform, appVersion,
  });
  return response.data;
};

export const unregisterPushToken = async (token: string) => {
  const response = await apiClient.post('/mobile/devices/unregister', { token });
  return response.data;
};

// ─── Parent ────────────────────────────────────────────────────────────────
export const fetchParentDashboard = async () => {
  const response = await apiClient.get('/mobile/parent/dashboard');
  return response.data;
};

export const fetchParentStudentProfile = async (studentId: string) => {
  const response = await apiClient.get(`/mobile/parent/student-profile/${studentId}`);
  return response.data;
};

export const getParentChildTimetable = async (studentId: string) => {
  const response = await apiClient.get(`/mobile/parent/student/${studentId}/timetable`);
  return response.data;
};

export const getParentChildHomework = async (studentId: string) => {
  const response = await apiClient.get(`/mobile/parent/student/${studentId}/homework`);
  return response.data;
};

export const getParentChildExams = async (studentId: string) => {
  const response = await apiClient.get(`/mobile/parent/student/${studentId}/exams`);
  return response.data;
};

export const getParentChildResults = async (studentId: string) => {
  const response = await apiClient.get(`/mobile/parent/student/${studentId}/results`);
  return response.data;
};

export const fetchParentAttendance = async (studentId?: string) => {
  const url = studentId
    ? `/mobile/parent/attendance?studentId=${studentId}`
    : '/mobile/parent/attendance';
  const response = await apiClient.get(url);
  return response.data;
};

export const fetchParentFees = async () => {
  const response = await apiClient.get('/mobile/parent/fees');
  return response.data;
};

export const fetchParentNotices = async () => {
  const response = await apiClient.get('/mobile/parent/notices');
  return response.data;
};

// ─── Student ───────────────────────────────────────────────────────────────
export const fetchStudentDashboard = async () => {
  const response = await apiClient.get('/mobile/student/dashboard');
  return response.data;
};

export const fetchStudentTimetable = async () => {
  const response = await apiClient.get('/mobile/student/timetable');
  return response.data;
};

export const fetchStudentHomework = async () => {
  const response = await apiClient.get('/mobile/student/homework');
  return response.data;
};

export const fetchStudentExams = async () => {
  const response = await apiClient.get('/mobile/student/exams');
  return response.data;
};

export const fetchStudentResults = async () => {
  const response = await apiClient.get('/mobile/student/results');
  return response.data;
};

export const getStudentHomeworkSubmission = async (homeworkId: string) => {
  const response = await apiClient.get(`/mobile/student/homework/${homeworkId}/submission`);
  return response.data;
};

export const submitStudentHomework = async (
  homeworkId: string,
  payload: {
    submissionText?: string;
    file?: {
      uri: string;
      name: string;
      type: string;
    };
  }
) => {
  const formData = new FormData();
  if (payload.submissionText) {
    formData.append('submissionText', payload.submissionText);
  }
  if (payload.file) {
    formData.append('file', {
      uri: payload.file.uri,
      name: payload.file.name,
      type: payload.file.type,
    } as any);
  }
  const response = await apiClient.post(`/mobile/student/homework/${homeworkId}/submit`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

// ─── Teacher ───────────────────────────────────────────────────────────────
export const fetchTeacherDashboard = async () => {
  const response = await apiClient.get('/mobile/teacher/dashboard');
  return response.data;
};

export const fetchTeacherTimetable = async () => {
  const response = await apiClient.get('/mobile/teacher/timetable');
  return response.data;
};

export const fetchTeacherNotices = async () => {
  const response = await apiClient.get('/mobile/teacher/notices');
  return response.data;
};

// ─── Teacher Homework Review ───────────────────────────────────────────────
export const getTeacherHomework = async () => {
  const response = await apiClient.get('/mobile/teacher/homework');
  return response.data;
};

export const getTeacherHomeworkSubmissions = async (homeworkId: string) => {
  const response = await apiClient.get(`/mobile/teacher/homework/${homeworkId}/submissions`);
  return response.data;
};

export const getTeacherHomeworkSubmissionDetail = async (submissionId: string) => {
  const response = await apiClient.get(`/mobile/teacher/homework/submissions/${submissionId}`);
  return response.data;
};

export const reviewTeacherHomeworkSubmission = async (
  submissionId: string,
  payload: {
    status: 'reviewed' | 'returned';
    teacherFeedback?: string;
    marks?: number;
  }
) => {
  const response = await apiClient.patch(`/mobile/teacher/homework/submissions/${submissionId}/review`, payload);
  return response.data;
};

export const downloadTeacherHomeworkSubmissionFile = async (submissionId: string) => {
  const response = await apiClient.get(`/mobile/teacher/homework/submissions/${submissionId}/download`, {
    responseType: 'blob',
  });
  return response.data;
};

// ─── Teacher Marks Entry ───────────────────────────────────────────────────
export const getTeacherMarksExams = async () => {
  const response = await apiClient.get('/mobile/teacher/marks/exams');
  return response.data;
};

export const getTeacherMarksExamSubjects = async (examId: string) => {
  const response = await apiClient.get(`/mobile/teacher/marks/exams/${examId}/subjects`);
  return response.data;
};

export const getTeacherMarksExamStudents = async (examId: string, subjectId: string) => {
  const response = await apiClient.get(`/mobile/teacher/marks/exams/${examId}/students?subjectId=${subjectId}`);
  return response.data;
};

export const saveTeacherMarks = async (
  examId: string,
  payload: {
    subjectId: string;
    maxMarks: number;
    marks: Array<{
      studentId: string;
      marksObtained: number;
      remarks?: string;
    }>;
  }
) => {
  const response = await apiClient.post(`/mobile/teacher/marks/exams/${examId}/save`, payload);
  return response.data;
};

// ─── Shared ────────────────────────────────────────────────────────────────
export const fetchNotices = async () => {
  const response = await apiClient.get('/notices?limit=20');
  return response.data;
};

