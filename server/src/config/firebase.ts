import { initializeApp, cert } from 'firebase-admin';
import { getMessaging, Messaging } from 'firebase-admin/messaging';

const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_PRIVATE_KEY;

const isEnabled = process.env.PUSH_NOTIFICATIONS_ENABLED === 'true';

let isInitialized = false;
let messaging: Messaging | null = null;

if (isEnabled) {
  if (!projectId || !clientEmail || !privateKey) {
    console.warn(
      '[Firebase Config] Push notifications are enabled, but configuration is incomplete. Firebase Admin will not be initialized.'
    );
  } else {
    try {
      // Handle private key newlines safely (replacing escaped newlines with actual newlines)
      const formattedKey = privateKey.replace(/\\n/g, '\n');

      initializeApp({
        credential: cert({
          projectId,
          clientEmail,
          privateKey: formattedKey,
        }),
      });
      isInitialized = true;
      messaging = getMessaging();
      console.log('[Firebase Config] Firebase Admin initialized successfully.');
    } catch (err: any) {
      console.error('[Firebase Config] Failed to initialize Firebase Admin:', err);
    }
  }
} else {
  console.log('[Firebase Config] Push notifications are disabled.');
}

export const firebaseConfig = {
  isEnabled: isEnabled && isInitialized,
  messaging,
};

