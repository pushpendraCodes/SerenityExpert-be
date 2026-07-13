import Notification from "../models/Notification.js";
import User from "../models/User.js";
import { sendPushNotification } from "../config/firebase.js";
import { emitToUser } from "../config/socket.js";
import { NotificationType } from "../types/index.js";
import { paginate } from "../utils/pagination.js";
import type { PaginationQuery } from "../types/index.js";

export async function createNotification(
  userId: string,
  title: string,
  body: string,
  type: NotificationType,
  data?: Record<string, unknown>
): Promise<void> {
  const notification = await Notification.create({
    userId,
    title,
    body,
    type,
    data: data || {},
  });

  emitToUser(userId, "notification:new", {
    id: notification._id.toString(),
    title,
    body,
    type,
  });

  const user = await User.findById(userId).select("fcmTokens");
  if (user?.fcmTokens?.length) {
    await sendPushNotification(
      user.fcmTokens,
      title,
      body,
      { type, notificationId: notification._id.toString() }
    );
  }
}

export async function getUserNotifications(userId: string, query: PaginationQuery) {
  return paginate({
    model: Notification,
    filter: { userId },
    query,
    sort: { createdAt: -1 },
  });
}

export async function markNotificationRead(userId: string, notificationId: string): Promise<void> {
  await Notification.findOneAndUpdate(
    { _id: notificationId, userId },
    { isRead: true, readAt: new Date() }
  );
}

export async function markAllNotificationsRead(userId: string): Promise<void> {
  await Notification.updateMany(
    { userId, isRead: false },
    { isRead: true, readAt: new Date() }
  );
}

export async function sendBulkNotification(
  title: string,
  body: string,
  options: { userIds?: string[]; role?: "user" | "expert" | "all" } = {}
): Promise<number> {
  const filter: Record<string, unknown> = { isBlocked: false };
  if (options.userIds?.length) {
    filter._id = { $in: options.userIds };
  } else if (options.role && options.role !== "all") {
    filter.role = options.role;
  }

  const users = await User.find(filter).select("_id fcmTokens");
  let count = 0;

  for (const user of users) {
    await createNotification(user._id.toString(), title, body, NotificationType.PROMO);
    count++;
  }

  return count;
}
