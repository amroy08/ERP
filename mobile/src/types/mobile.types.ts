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
  status: 'pending' | 'submitted' | 'graded';
}

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
