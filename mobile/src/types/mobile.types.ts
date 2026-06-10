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
