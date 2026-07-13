import { NotificationType } from "../types/index.js";
import type { PaginationQuery } from "../types/index.js";
export declare function createNotification(userId: string, title: string, body: string, type: NotificationType, data?: Record<string, unknown>): Promise<void>;
export declare function getUserNotifications(userId: string, query: PaginationQuery): Promise<import("../types/index.js").PaginatedResult<import("../models/Notification.js").INotification>>;
export declare function markNotificationRead(userId: string, notificationId: string): Promise<void>;
export declare function markAllNotificationsRead(userId: string): Promise<void>;
export declare function sendBulkNotification(title: string, body: string, options?: {
    userIds?: string[];
    role?: "user" | "expert" | "all";
}): Promise<number>;
//# sourceMappingURL=notification.service.d.ts.map