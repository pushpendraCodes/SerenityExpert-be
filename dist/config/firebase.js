"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendPushNotification = exports.initializeFirebase = void 0;
const firebase_admin_1 = __importDefault(require("firebase-admin"));
const User_js_1 = __importDefault(require("../models/User.js"));
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
 * Send a push notification via FCM (web + Android Chrome).
 * High priority so incoming calls wake the device when possible.
 */
const sendPushNotification = async (tokens, title, body, data) => {
    if (!firebaseInitialized || tokens.length === 0)
        return;
    const isCall = data?.type === "incoming_call" || data?.type === "call";
    // FCM data values must all be strings
    const pushData = {};
    for (const [k, v] of Object.entries(data || {})) {
        if (v !== undefined && v !== null)
            pushData[k] = String(v);
    }
    pushData.title = title;
    pushData.body = body;
    try {
        const message = {
            tokens,
            notification: { title, body },
            data: pushData,
            android: {
                priority: "high",
                ttl: isCall ? 60_000 : 3600_000,
                notification: {
                    title,
                    body,
                    sound: "default",
                    channelId: isCall ? "incoming_calls" : "general",
                    priority: isCall ? "max" : "high",
                    defaultVibrateTimings: true,
                    visibility: "public",
                },
            },
            webpush: {
                headers: {
                    Urgency: isCall ? "high" : "normal",
                    TTL: isCall ? "60" : "3600",
                },
                notification: {
                    title,
                    body,
                    icon: "/favicon.svg",
                    badge: "/favicon.svg",
                    requireInteraction: isCall,
                    vibrate: isCall ? [300, 100, 300, 100, 300] : [100, 50, 100],
                    tag: isCall && pushData.callId ? `call-${pushData.callId}` : undefined,
                },
                fcmOptions: {
                    // Opens staff portal when notification is clicked
                    link: isCall && pushData.callId
                        ? `/calls?incoming=1&callId=${encodeURIComponent(pushData.callId)}&callerName=${encodeURIComponent(pushData.callerName || "A user")}`
                        : "/notifications",
                },
            },
        };
        const response = await firebase_admin_1.default.messaging().sendEachForMulticast(message);
        console.log(`📲 Push sent: ${response.successCount}/${tokens.length} successful`);
        if (response.failureCount > 0) {
            const failedTokens = [];
            response.responses.forEach((resp, idx) => {
                if (!resp.success) {
                    failedTokens.push(tokens[idx]);
                    console.warn(`⚠️ FCM token failed [${resp.error?.code}]: ${resp.error?.message}`);
                }
            });
            if (failedTokens.length) {
                await User_js_1.default.updateMany({ fcmTokens: { $in: failedTokens } }, { $pull: { fcmTokens: { $in: failedTokens } } });
                console.warn(`⚠️ ${failedTokens.length} FCM tokens failed and were removed`);
            }
        }
    }
    catch (err) {
        console.error("❌ Push notification failed:", err);
    }
};
exports.sendPushNotification = sendPushNotification;
exports.default = firebase_admin_1.default;
//# sourceMappingURL=firebase.js.map