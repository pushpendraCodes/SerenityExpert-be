import admin from "firebase-admin";

let firebaseInitialized = false;

export const initializeFirebase = (): void => {
  if (firebaseInitialized) return;

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!projectId || !clientEmail || !privateKey) {
    console.warn("⚠️ Firebase credentials not configured. Push notifications disabled.");
    return;
  }

  admin.initializeApp({
    credential: admin.credential.cert({
      projectId,
      clientEmail,
      privateKey,
    }),
  });

  firebaseInitialized = true;
  console.log("✅ Firebase Admin initialized");
};

/**
 * Send a push notification via FCM.
 */
export const sendPushNotification = async (
  tokens: string[],
  title: string,
  body: string,
  data?: Record<string, string>
): Promise<void> => {
  if (!firebaseInitialized || tokens.length === 0) return;

  try {
    const message: admin.messaging.MulticastMessage = {
      tokens,
      notification: { title, body },
      data,
      webpush: {
        notification: {
          icon: "/icon-192x192.png",
          badge: "/badge-72x72.png",
        },
      },
    };

    const response = await admin.messaging().sendEachForMulticast(message);
    console.log(`📲 Push sent: ${response.successCount}/${tokens.length} successful`);

    // Remove invalid tokens
    if (response.failureCount > 0) {
      const failedTokens: string[] = [];
      response.responses.forEach((resp, idx) => {
        if (!resp.success) {
          failedTokens.push(tokens[idx]);
        }
      });
      // TODO: Remove failed tokens from user records
      console.warn(`⚠️ ${failedTokens.length} FCM tokens failed`);
    }
  } catch (err) {
    console.error("❌ Push notification failed:", err);
  }
};

export default admin;
