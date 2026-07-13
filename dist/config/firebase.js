"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendPushNotification = exports.initializeFirebase = void 0;
const firebase_admin_1 = __importDefault(require("firebase-admin"));
let firebaseInitialized = false;
const initializeFirebase = () => {
    if (firebaseInitialized)
        return;
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");
    if (!projectId || !clientEmail || !privateKey) {
        console.warn("⚠️ Firebase credentials not configured. Push notifications disabled.");
        return;
    }
    firebase_admin_1.default.initializeApp({
        credential: firebase_admin_1.default.credential.cert({
            projectId,
            clientEmail,
            privateKey,
        }),
    });
    firebaseInitialized = true;
    console.log("✅ Firebase Admin initialized");
};
exports.initializeFirebase = initializeFirebase;
/**
 * Send a push notification via FCM.
 */
const sendPushNotification = async (tokens, title, body, data) => {
    if (!firebaseInitialized || tokens.length === 0)
        return;
    try {
        const message = {
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
        const response = await firebase_admin_1.default.messaging().sendEachForMulticast(message);
        console.log(`📲 Push sent: ${response.successCount}/${tokens.length} successful`);
        // Remove invalid tokens
        if (response.failureCount > 0) {
            const failedTokens = [];
            response.responses.forEach((resp, idx) => {
                if (!resp.success) {
                    failedTokens.push(tokens[idx]);
                }
            });
            // TODO: Remove failed tokens from user records
            console.warn(`⚠️ ${failedTokens.length} FCM tokens failed`);
        }
    }
    catch (err) {
        console.error("❌ Push notification failed:", err);
    }
};
exports.sendPushNotification = sendPushNotification;
exports.default = firebase_admin_1.default;
//# sourceMappingURL=firebase.js.map