import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { registerPushToken, unregisterPushToken } from '../api/mobileApi';

// Setup foreground notification handler
// Setup foreground notification handler safely (catching Expo Go SDK 53+ deprecation errors)
try {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
} catch (err: any) {
  console.warn('[Notification Service] Failed to initialize notification handler (likely running in Expo Go):', err.message);
}


/**
 * Configure push notification behavior and register token.
 * Note: Expo Go testing has limited push support. Production push notifications
 * require configuring EAS Build credentials and Firebase Console setup.
 */
export async function registerForPushNotificationsAsync(): Promise<string | null> {
  if (Platform.OS === 'web') {
    console.log('[Notification Service] Web platform is not supported for native push notifications.');
    return null;
  }

  if (!Device.isDevice) {
    console.log('[Notification Service] Must use physical device for native push notifications.');
    return null;
  }

  try {
    // 1. Request/verify permissions
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('[Notification Service] Failed to get push token: permission denied.');
      return null;
    }

    // 2. Fetch Expo push token
    // In SDK 51+, getExpoPushTokenAsync may need projectId, but it can fallback to local config.
    // We catch errors to avoid blocking the app flow if EAS config is not completed yet.
    let tokenData;
    try {
      tokenData = await Notifications.getExpoPushTokenAsync();
    } catch (tokenErr: any) {
      console.warn('[Notification Service] Could not fetch Expo push token (EAS projectId might be missing):', tokenErr.message);
      return null;
    }

    const token = tokenData.data;
    if (!token) return null;

    // Log only a masked prefix of the token to avoid exposing it in logs
    const maskedToken = token.substring(0, 20) + '...';
    console.log('[Notification Service] Push token obtained (masked):', maskedToken);

    // 3. Register token with backend API
    const deviceType = Platform.OS === 'ios' ? 'ios' : Platform.OS === 'android' ? 'android' : 'web';
    const appVersion = '1.0.0'; // Replace with dynamic versioning if preferred
    const platformName = Platform.OS + ' ' + Platform.Version;

    try {
      await registerPushToken(token, deviceType, platformName, appVersion);
      console.log('[Notification Service] Push token registered with backend successfully.');
    } catch (apiErr: any) {
      console.error('[Notification Service] Failed to register push token with backend:', apiErr.message);
    }

    // 4. Configure Android channels if applicable
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }

    return token;
  } catch (err: any) {
    console.error('[Notification Service] Error in push notification setup:', err);
    return null;
  }
}

/**
 * Unregister push token on logout.
 */
export async function unregisterForPushNotificationsAsync(token: string): Promise<void> {
  if (!token) return;
  try {
    await unregisterPushToken(token);
    console.log('[Notification Service] Push token unregistered with backend successfully.');
  } catch (err: any) {
    console.error('[Notification Service] Failed to unregister push token with backend:', err.message);
  }
}

/**
 * Sets up listeners to respond to incoming notification clicks.
 */
export function setupNotificationListeners(): () => void {
  if (Platform.OS === 'web') return () => {};

  try {
    // Listener for response/click in foreground or background
    const responseSubscription = Notifications.addNotificationResponseReceivedListener(response => {
      const data = response.notification.request.content.data;
      console.log('[Notification Service] Notification clicked:', {
        actionIdentifier: response.actionIdentifier,
        data,
      });
      // Placeholder routing deep-linking logic
      // Example: if (data.type === 'homework') navigate('Homework', { id: data.entityId });
    });

    // Listener for received notification in foreground
    const receivedSubscription = Notifications.addNotificationReceivedListener(notification => {
      console.log('[Notification Service] Notification received in foreground:', notification.request.content);
    });

    return () => {
      try {
        responseSubscription.remove();
        receivedSubscription.remove();
      } catch (removeErr: any) {
        console.warn('[Notification Service] Failed to remove notification listeners:', removeErr.message);
      }
    };
  } catch (err: any) {
    console.warn('[Notification Service] Failed to set up notification listeners (likely running in Expo Go):', err.message);
    return () => {};
  }
}

// ─── Phase 4.1C In-App Notification APIs ────────────────────────────────────
import apiClient from '../api/apiClient';

export interface Notification {
  id: string;
  type: 'HOMEWORK_POSTED' | 'EXAM_POSTED' | 'MARKS_POSTED' | 'NOTICE_POSTED' | 'FEES_OVERDUE' | 'FEES_REMINDER' | 'ATTENDANCE_ABSENCE_ALERT';
  title: string;
  message: string;
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
  relatedEntityType: string | null;
  relatedEntityId: string | null;
  studentId: string | null;
}

export async function getNotifications(params?: {
  studentId?: string;
  isRead?: boolean;
  limit?: number;
  page?: number;
}): Promise<Notification[]> {
  try {
    const response = await apiClient.get('/notifications', { params });
    return response.data.data || [];
  } catch (error) {
    console.error('[Notification Service] getNotifications error:', error);
    throw error;
  }
}

export async function getUnreadCount(params?: { studentId?: string }): Promise<number> {
  try {
    const response = await apiClient.get('/notifications/unread-count', { params });
    return response.data.unreadCount ?? 0;
  } catch (error) {
    console.error('[Notification Service] getUnreadCount error:', error);
    return 0;
  }
}

export async function markNotificationRead(id: string): Promise<Notification> {
  try {
    const response = await apiClient.patch(`/notifications/${id}/read`);
    return response.data.notification;
  } catch (error) {
    console.error('[Notification Service] markNotificationRead error:', error);
    throw error;
  }
}

export async function markAllNotificationsRead(payload?: { studentId?: string }): Promise<void> {
  try {
    await apiClient.patch('/notifications/mark-all-read', payload);
  } catch (error) {
    console.error('[Notification Service] markAllNotificationsRead error:', error);
    throw error;
  }
}

