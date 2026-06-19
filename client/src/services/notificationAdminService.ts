import axiosInstance from '../api/axiosInstance';
import { ApiResponse } from '../types';

export interface NotificationRule {
  id: string;
  schoolId: string;
  type: 'FEES_REMINDER' | 'ATTENDANCE_ABSENCE_ALERT';
  enabled: boolean;
  cooldownHours: number;
  thresholdCount: number | null;
  thresholdDays: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface DeliveryLog {
  channel: string;
  status: string;
}

export interface NotificationLog {
  id: string;
  type: string;
  recipientRole: string;
  recipientUserId: string;
  studentId: string | null;
  title: string;
  message: string;
  priority: string;
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
  relatedEntityType: string | null;
  relatedEntityId: string | null;
  deliveryLogs: DeliveryLog[];
}

export interface NotificationLogSummary {
  total: number;
  read: number;
  unread: number;
  activeRules: number;
  breakdown: Record<string, number>;
}

export interface ReminderScanDetail {
  scanned: number;
  eligible?: number;
  thresholdMet?: number;
  created: number;
  skippedPaid?: number;
  skippedCooldown: number;
  skippedNoParent: number;
  errors: number;
}

export interface ReminderScanResults {
  feeReminderScan: ReminderScanDetail;
  absenceReminderScan: ReminderScanDetail;
}

export interface PaginatedLogs {
  success: boolean;
  data: NotificationLog[];
  pagination: {
    page: number;
    limit: number;
    total: number;
  };
}

export const getNotificationRules = async (): Promise<ApiResponse<NotificationRule[]>> => {
  const response = await axiosInstance.get<ApiResponse<NotificationRule[]>>('/notifications/admin/rules');
  return response.data;
};

export const updateNotificationRule = async (
  ruleId: string,
  payload: Partial<Pick<NotificationRule, 'enabled' | 'cooldownHours' | 'thresholdCount' | 'thresholdDays'>>
): Promise<ApiResponse<NotificationRule>> => {
  const response = await axiosInstance.put<ApiResponse<NotificationRule>>(`/notifications/admin/rules/${ruleId}`, payload);
  return response.data;
};

export const getNotificationLogs = async (params: {
  type?: string;
  recipientRole?: string;
  isRead?: string;
  priority?: string;
  page?: number;
  limit?: number;
}): Promise<PaginatedLogs> => {
  const response = await axiosInstance.get<PaginatedLogs>('/notifications/admin/logs', { params });
  return response.data;
};

export const getNotificationLogSummary = async (): Promise<ApiResponse<NotificationLogSummary>> => {
  const response = await axiosInstance.get<ApiResponse<NotificationLogSummary>>('/notifications/admin/logs/summary');
  return response.data;
};

export const runNotificationReminders = async (): Promise<ApiResponse<ReminderScanResults>> => {
  const response = await axiosInstance.post<ApiResponse<ReminderScanResults>>('/notifications/admin/run-reminders');
  return response.data;
};
