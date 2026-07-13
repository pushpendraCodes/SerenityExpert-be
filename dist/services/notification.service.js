"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createNotification = createNotification;
exports.getUserNotifications = getUserNotifications;
exports.markNotificationRead = markNotificationRead;
exports.markAllNotificationsRead = markAllNotificationsRead;
exports.sendBulkNotification = sendBulkNotification;
const Notification_js_1 = __importDefault(require("../models/Notification.js"));
const User_js_1 = __importDefault(require("../models/User.js"));
const firebase_js_1 = require("../config/firebase.js");
const socket_js_1 = require("../config/socket.js");
const index_js_1 = require("../types/index.js");
const pagination_js_1 = require("../utils/pagination.js");
async function createNotification(userId, title, body, type, data) {
    const notification = await Notification_js_1.default.create({
        userId,
        title,
        body,
        type,
        data: data || {},
    });
    (0, socket_js_1.emitToUser)(userId, "notification:new", {
        id: notification._id.toString(),
        title,
        body,
        type,
    });
    const user = await User_js_1.default.findById(userId).select("fcmTokens");
    if (user?.fcmTokens?.length) {
        await (0, firebase_js_1.sendPushNotification)(user.fcmTokens, title, body, { type, notificationId: notification._id.toString() });
    }
}
async function getUserNotifications(userId, query) {
    return (0, pagination_js_1.paginate)({
        model: Notification_js_1.default,
        filter: { userId },
        query,
        sort: { createdAt: -1 },
    });
}
async function markNotificationRead(userId, notificationId) {
    await Notification_js_1.default.findOneAndUpdate({ _id: notificationId, userId }, { isRead: true, readAt: new Date() });
}
async function markAllNotificationsRead(userId) {
    await Notification_js_1.default.updateMany({ userId, isRead: false }, { isRead: true, readAt: new Date() });
}
async function sendBulkNotification(title, body, options = {}) {
    const filter = { isBlocked: false };
    if (options.userIds?.length) {
        filter._id = { $in: options.userIds };
    }
    else if (options.role && options.role !== "all") {
        filter.role = options.role;
    }
    const users = await User_js_1.default.find(filter).select("_id fcmTokens");
    let count = 0;
    for (const user of users) {
        await createNotification(user._id.toString(), title, body, index_js_1.NotificationType.PROMO);
        count++;
    }
    return count;
}
//# sourceMappingURL=notification.service.js.map