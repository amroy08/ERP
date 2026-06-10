import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { registerPushToken, unregisterPushToken } from '../api/mobileApi';

// Setup foreground notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

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

    console.log('[Notification Service] Generated Push Token:', token);

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
    responseSubscription.remove();
    receivedSubscription.remove();
  };
}
