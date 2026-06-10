import prisma from '../config/prisma';
import { firebaseConfig } from '../config/firebase';

export interface PushPayload {
  title: string;
  body: string;
  data?: Record<string, string>;
}

export interface PushSendResult {
  attempted: number;
  successCount: number;
  failureCount: number;
  disabled: boolean;
}

export class PushNotificationService {
  /**
   * Send push notification to a single user's active devices.
   */
  static async sendToUser(userId: string, payload: PushPayload): Promise<PushSendResult> {
    return this.sendToUsers([userId], payload);
  }

  /**
   * Send push notification to multiple users' active devices.
   */
  static async sendToUsers(userIds: string[], payload: PushPayload): Promise<PushSendResult> {
    try {
      if (!firebaseConfig.isEnabled || !firebaseConfig.messaging) {
        return { attempted: 0, successCount: 0, failureCount: 0, disabled: true };
      }

      // Fetch active tokens for target users
      const deviceTokens = await prisma.deviceToken.findMany({
        where: {
          userId: { in: userIds },
          isActive: true,
        },
        select: { token: true },
      });

      const tokens = deviceTokens.map(dt => dt.token);
      if (tokens.length === 0) {
        return { attempted: 0, successCount: 0, failureCount: 0, disabled: false };
      }

      return this.sendToTokens(tokens, payload);
    } catch (error) {
      console.error('[PushNotificationService] Error in sendToUsers:', error);
      return { attempted: 0, successCount: 0, failureCount: 0, disabled: false };
    }
  }

  /**
   * Send push notification directly to specific device tokens.
   */
  static async sendToTokens(tokens: string[], payload: PushPayload): Promise<PushSendResult> {
    try {
      if (!firebaseConfig.isEnabled || !firebaseConfig.messaging) {
        return { attempted: 0, successCount: 0, failureCount: 0, disabled: true };
      }

      const messaging = firebaseConfig.messaging;
      const messages = tokens.map(token => ({
        token,
        notification: {
          title: payload.title,
          body: payload.body,
        },
        data: payload.data,
      }));

      console.log(`[PushNotificationService] Attempting to send to ${tokens.length} tokens...`);
      const response = await messaging.sendEach(messages);

      let successCount = 0;
      let failureCount = 0;
      const invalidTokens: string[] = [];

      response.responses.forEach((res: any, index: number) => {
        if (res.success) {
          successCount++;
        } else {
          failureCount++;
          const token = tokens[index];
          const errorCode = res.error?.code;
          console.warn(`[PushNotificationService] Token send failed. Code: ${errorCode}, Error: ${res.error?.message}`);

          // Deactivate token if it is invalid/unregistered
          if (
            errorCode === 'messaging/invalid-registration-token' ||
            errorCode === 'messaging/registration-token-not-registered' ||
            errorCode === 'messaging/invalid-argument'
          ) {
            invalidTokens.push(token);
          }
        }
      });

      // Update invalid tokens in DB in background/batch
      if (invalidTokens.length > 0) {
        try {
          await prisma.deviceToken.updateMany({
            where: { token: { in: invalidTokens } },
            data: { isActive: false },
          });
          console.log(`[PushNotificationService] Deactivated ${invalidTokens.length} invalid tokens.`);
        } catch (dbErr) {
          console.error('[PushNotificationService] Failed to deactivate invalid tokens in DB:', dbErr);
        }
      }

      return {
        attempted: tokens.length,
        successCount,
        failureCount,
        disabled: false,
      };
    } catch (error) {
      console.error('[PushNotificationService] Error in sendToTokens:', error);
      return {
        attempted: tokens.length,
        successCount: 0,
        failureCount: tokens.length,
        disabled: false,
      };
    }
  }
}
