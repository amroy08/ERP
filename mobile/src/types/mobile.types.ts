export interface DeviceTokenRegisterPayload {
  token: string;
  deviceType: 'ios' | 'android';
  platform?: string;
  appVersion?: string;
}

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
