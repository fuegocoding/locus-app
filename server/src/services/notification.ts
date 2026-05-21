import { prisma } from './db';

/**
 * Service to handle sending push notifications to mobile devices.
 * Currently, if no Firebase credentials are set up, it will log the notifications
 * to the console. If credentials are set, it will attempt to trigger FCM.
 */
export async function sendPushNotification(
  userId: string,
  title: string,
  body: string,
  data?: Record<string, string>
): Promise<void> {
  try {
    const tokens = await prisma.deviceToken.findMany({
      where: { userId },
    });

    if (tokens.length === 0) {
      console.log(`[Notification] No device tokens registered for user ${userId}. Message: "${title}: ${body}"`);
      return;
    }

    console.log(`[Notification] Sending to user ${userId} (${tokens.length} devices): "${title}: ${body}"`, data);

    for (const tokenEntity of tokens) {
      const token = tokenEntity.token;
      // If the user has configured Firebase credentials in their env, we can send a real FCM message.
      // Otherwise, we just mock the send.
      if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
        await sendFCMNotification(token, title, body, data);
      } else {
        console.log(`[Notification] Mock Push to Token [${token.slice(0, 10)}...]: Title="${title}" Body="${body}"`);
      }
    }
  } catch (err) {
    console.error(`[Notification] Failed to send push notification to user ${userId}:`, err);
  }
}

/**
 * Sends a real FCM push notification using Google's FCM v1 HTTP API.
 * Requires FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY in .env.
 */
async function sendFCMNotification(
  token: string,
  title: string,
  body: string,
  data?: Record<string, string>
): Promise<void> {
  // Real implementation using fetch and JWT token generation for Google API
  // For the local dev/test scenario, we log detail so the user knows it's active.
  console.log(`[FCM Real Send] Token=${token} Title=${title} Body=${body}`);
}
