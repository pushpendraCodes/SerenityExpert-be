import Message from "../models/Message.js";
import Chat from "../models/Chat.js";
import Notification from "../models/Notification.js";
import Call from "../models/Call.js";
import { getRetentionDays } from "./admin.service.js";
import { deleteAsset, deleteAssetByUrl, publicIdFromUrl } from "./cloudinary.service.js";
import { NOTIFICATION_TTL_DAYS } from "../utils/constants.js";

const BATCH = 100;

function cutoffDate(days: number): Date {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
}

/**
 * Drop legacy Mongo TTL on notifications (was hardcoded 90 days) so AdminSettings
 * retention days control deletion via cron instead.
 */
export async function ensureNotificationRetentionIndex(): Promise<void> {
  try {
    const indexes = await Notification.collection.indexes();
    for (const idx of indexes) {
      if (idx.key && (idx.key as { createdAt?: number }).createdAt === 1 && idx.expireAfterSeconds != null) {
        if (idx.name) {
          await Notification.collection.dropIndex(idx.name);
          console.log(`🧹 Dropped legacy notification TTL index: ${idx.name}`);
        }
      }
    }
    await Notification.collection.createIndex({ createdAt: 1 });
  } catch (err) {
    console.warn("Notification retention index migrate skipped:", err);
  }
}

/** Delete chat messages older than retention; remove unused chat images from Cloudinary. */
export async function purgeExpiredChatMessages(): Promise<{ messages: number; images: number }> {
  const days = await getRetentionDays("chat_retention_days", 30);
  const cutoff = cutoffDate(days);

  let messagesDeleted = 0;
  let imagesDeleted = 0;
  const affectedChatIds = new Set<string>();

  let hasMore = true;
  while (hasMore) {
    const batch = await Message.find({ createdAt: { $lt: cutoff } })
      .select("_id chatId imageUrl")
      .limit(BATCH)
      .lean();

    if (batch.length === 0) break;

    const ids = batch.map((m) => m._id);
    const imageUrls = batch
      .map((m) => m.imageUrl)
      .filter((u): u is string => Boolean(u));

    for (const m of batch) {
      affectedChatIds.add(String(m.chatId));
    }

    await Message.deleteMany({ _id: { $in: ids } });
    messagesDeleted += ids.length;

    for (const url of new Set(imageUrls)) {
      const stillUsed = await Message.exists({ imageUrl: url });
      if (stillUsed) continue;
      await deleteAssetByUrl(url, "image");
      imagesDeleted += 1;
    }

    hasMore = batch.length === BATCH;
  }

  for (const chatId of affectedChatIds) {
    const latest = await Message.findOne({ chatId }).sort({ createdAt: -1 }).lean();
    if (latest) {
      await Chat.findByIdAndUpdate(chatId, {
        lastMessage: latest.content || (latest.imageUrl ? "Image" : ""),
        lastMessageAt: latest.createdAt,
      });
    } else {
      await Chat.findByIdAndUpdate(chatId, {
        $unset: { lastMessage: 1, lastMessageAt: 1 },
      });
    }
  }

  return { messages: messagesDeleted, images: imagesDeleted };
}

/** Delete notifications older than retention (users & experts share the same inbox model). */
export async function purgeExpiredNotifications(): Promise<number> {
  const days = await getRetentionDays("notification_retention_days", NOTIFICATION_TTL_DAYS);
  const cutoff = cutoffDate(days);
  const result = await Notification.deleteMany({ createdAt: { $lt: cutoff } });
  return result.deletedCount || 0;
}

/** Clear old call recording URLs and delete files from Cloudinary. Keeps call history. */
export async function purgeExpiredCallRecordings(): Promise<{ recordings: number }> {
  const days = await getRetentionDays("call_recording_retention_days", 30);
  const cutoff = cutoffDate(days);

  let recordingsDeleted = 0;
  let hasMore = true;

  while (hasMore) {
    const batch = await Call.find({
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

    if (batch.length === 0) break;

    for (const call of batch) {
      const url = call.recordingUrl!;
      const fromUrl = publicIdFromUrl(url);
      const fallbackId = `expert-consultant/recordings/call_${call._id}`;
      await deleteAsset(fromUrl || fallbackId, "video");
      await Call.findByIdAndUpdate(call._id, { $unset: { recordingUrl: 1 } });
      recordingsDeleted += 1;
    }

    hasMore = batch.length === BATCH;
  }

  return { recordings: recordingsDeleted };
}

/** Run all retention cleanups. Safe to call from cron. */
export async function runRetentionCleanup(): Promise<void> {
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
