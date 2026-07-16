"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ensureNotificationRetentionIndex = ensureNotificationRetentionIndex;
exports.purgeExpiredChatMessages = purgeExpiredChatMessages;
exports.purgeExpiredNotifications = purgeExpiredNotifications;
exports.purgeExpiredCallRecordings = purgeExpiredCallRecordings;
exports.runRetentionCleanup = runRetentionCleanup;
const Message_js_1 = __importDefault(require("../models/Message.js"));
const Chat_js_1 = __importDefault(require("../models/Chat.js"));
const Notification_js_1 = __importDefault(require("../models/Notification.js"));
const Call_js_1 = __importDefault(require("../models/Call.js"));
const admin_service_js_1 = require("./admin.service.js");
const cloudinary_service_js_1 = require("./cloudinary.service.js");
const constants_js_1 = require("../utils/constants.js");
const BATCH = 100;
function cutoffDate(days) {
    return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
}
/**
 * Drop legacy Mongo TTL on notifications (was hardcoded 90 days) so AdminSettings
 * retention days control deletion via cron instead.
 */
async function ensureNotificationRetentionIndex() {
    try {
        const indexes = await Notification_js_1.default.collection.indexes();
        for (const idx of indexes) {
            if (idx.key && idx.key.createdAt === 1 && idx.expireAfterSeconds != null) {
                if (idx.name) {
                    await Notification_js_1.default.collection.dropIndex(idx.name);
                    console.log(`🧹 Dropped legacy notification TTL index: ${idx.name}`);
                }
            }
        }
        await Notification_js_1.default.collection.createIndex({ createdAt: 1 });
    }
    catch (err) {
        console.warn("Notification retention index migrate skipped:", err);
    }
}
/** Delete chat messages older than retention; remove unused chat images from Cloudinary. */
async function purgeExpiredChatMessages() {
    const days = await (0, admin_service_js_1.getRetentionDays)("chat_retention_days", 30);
    const cutoff = cutoffDate(days);
    let messagesDeleted = 0;
    let imagesDeleted = 0;
    const affectedChatIds = new Set();
    let hasMore = true;
    while (hasMore) {
        const batch = await Message_js_1.default.find({ createdAt: { $lt: cutoff } })
            .select("_id chatId imageUrl")
            .limit(BATCH)
            .lean();
        if (batch.length === 0)
            break;
        const ids = batch.map((m) => m._id);
        const imageUrls = batch
            .map((m) => m.imageUrl)
            .filter((u) => Boolean(u));
        for (const m of batch) {
            affectedChatIds.add(String(m.chatId));
        }
        await Message_js_1.default.deleteMany({ _id: { $in: ids } });
        messagesDeleted += ids.length;
        for (const url of new Set(imageUrls)) {
            const stillUsed = await Message_js_1.default.exists({ imageUrl: url });
            if (stillUsed)
                continue;
            await (0, cloudinary_service_js_1.deleteAssetByUrl)(url, "image");
            imagesDeleted += 1;
        }
        hasMore = batch.length === BATCH;
    }
    for (const chatId of affectedChatIds) {
        const latest = await Message_js_1.default.findOne({ chatId }).sort({ createdAt: -1 }).lean();
        if (latest) {
            await Chat_js_1.default.findByIdAndUpdate(chatId, {
                lastMessage: latest.content || (latest.imageUrl ? "Image" : ""),
                lastMessageAt: latest.createdAt,
            });
        }
        else {
            await Chat_js_1.default.findByIdAndUpdate(chatId, {
                $unset: { lastMessage: 1, lastMessageAt: 1 },
            });
        }
    }
    return { messages: messagesDeleted, images: imagesDeleted };
}
/** Delete notifications older than retention (users & experts share the same inbox model). */
async function purgeExpiredNotifications() {
    const days = await (0, admin_service_js_1.getRetentionDays)("notification_retention_days", constants_js_1.NOTIFICATION_TTL_DAYS);
    const cutoff = cutoffDate(days);
    const result = await Notification_js_1.default.deleteMany({ createdAt: { $lt: cutoff } });
    return result.deletedCount || 0;
}
/** Clear old call recording URLs and delete files from Cloudinary. Keeps call history. */
async function purgeExpiredCallRecordings() {
    const days = await (0, admin_service_js_1.getRetentionDays)("call_recording_retention_days", 30);
    const cutoff = cutoffDate(days);
    let recordingsDeleted = 0;
    let hasMore = true;
    while (hasMore) {
        const batch = await Call_js_1.default.find({
            recordingUrl: { $exists: true, $nin: [null, ""] },
            $or: [
                { endedAt: { $lt: cutoff } },
                { endedAt: { $exists: false }, createdAt: { $lt: cutoff } },
                { endedAt: null, createdAt: { $lt: cutoff } },
            ],
        })
            .select("_id recordingUrl")
            .limit(BATCH)
            .lean();
        if (batch.length === 0)
            break;
        for (const call of batch) {
            const url = call.recordingUrl;
            const fromUrl = (0, cloudinary_service_js_1.publicIdFromUrl)(url);
            const fallbackId = `expert-consultant/recordings/call_${call._id}`;
            await (0, cloudinary_service_js_1.deleteAsset)(fromUrl || fallbackId, "video");
            await Call_js_1.default.findByIdAndUpdate(call._id, { $unset: { recordingUrl: 1 } });
            recordingsDeleted += 1;
        }
        hasMore = batch.length === BATCH;
    }
    return { recordings: recordingsDeleted };
}
/** Run all retention cleanups. Safe to call from cron. */
async function runRetentionCleanup() {
    const chat = await purgeExpiredChatMessages();
    if (chat.messages > 0 || chat.images > 0) {
        console.log(`🧹 Retention: deleted ${chat.messages} chat messages, ${chat.images} Cloudinary chat images`);
    }
    const notifications = await purgeExpiredNotifications();
    if (notifications > 0) {
        console.log(`🧹 Retention: deleted ${notifications} notifications`);
    }
    const recordings = await purgeExpiredCallRecordings();
    if (recordings.recordings > 0) {
        console.log(`🧹 Retention: deleted ${recordings.recordings} call recordings from Cloudinary`);
    }
}
//# sourceMappingURL=retention.service.js.map