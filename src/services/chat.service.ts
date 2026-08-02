import mongoose from "mongoose";
import Chat from "../models/Chat.js";
import Message from "../models/Message.js";
import Expert from "../models/Expert.js";
import { emitToChat, emitToUser } from "../config/socket.js";
import { createNotification } from "./notification.service.js";
import { paginate } from "../utils/pagination.js";
import { ChatStatus, MessageType, NotificationType } from "../types/index.js";
import { NotFoundError, ForbiddenError, ValidationError } from "../utils/AppError.js";
import type { PaginationQuery, PaginatedResult } from "../types/index.js";
import type { IChat } from "../models/Chat.js";
import type { IMessage } from "../models/Message.js";

type ChatListItem = Record<string, unknown> & { unreadCount: number };

export async function getOrCreateChat(userId: string, expertId: string): Promise<IChat> {
  const expert = await Expert.findOne({ _id: expertId, isApproved: true });
  if (!expert) {
    throw new NotFoundError("Person");
  }

  // Never allow chatting with yourself (dual-portal staff on user site)
  if (expert.userId.toString() === userId) {
    throw new ValidationError("You cannot start a chat with yourself");
  }

  let chat = await Chat.findOne({ userId, expertId });
  if (!chat) {
    chat = await Chat.create({ userId, expertId, status: ChatStatus.ACTIVE });
  }

  const populated = await Chat.findById(chat._id)
    .populate({ path: "userId", select: "name avatar gender" })
    .populate({
      path: "expertId",
      select: "userId status pricePerMinute isApproved",
      populate: { path: "userId", select: "name avatar gender" },
    });

  return (populated || chat) as IChat;
}

export async function getUserChats(
  userId: string,
  isExpert: boolean,
  query: PaginationQuery
): Promise<PaginatedResult<ChatListItem>> {
  const filter = isExpert
    ? { expertId: (await Expert.findOne({ userId }))?._id }
    : { userId };

  const result = await paginate({
    model: Chat,
    filter,
    query,
    populate: [
      {
        path: "userId",
        select: "name avatar gender",
      },
      {
        path: "expertId",
        select: "userId status pricePerMinute isApproved",
        populate: { path: "userId", select: "name avatar gender" },
      },
    ],
    sort: { lastMessageAt: -1, updatedAt: -1 },
  });

  const chatIds = result.data.map((c) => c._id);
  const unreadMap = new Map<string, number>();

  if (chatIds.length > 0) {
    const viewerOid = new mongoose.Types.ObjectId(userId);
    const unreadRows = await Message.aggregate<{ _id: mongoose.Types.ObjectId; count: number }>([
      {
        $match: {
          chatId: { $in: chatIds },
          senderId: { $ne: viewerOid },
          isRead: false,
        },
      },
      { $group: { _id: "$chatId", count: { $sum: 1 } } },
    ]);
    for (const row of unreadRows) {
      unreadMap.set(String(row._id), row.count);
    }
  }

  return {
    ...result,
    data: result.data.map((chat) => ({
      ...(chat as unknown as Record<string, unknown>),
      unreadCount: unreadMap.get(String(chat._id)) || 0,
    })),
  };
}

export async function getChatMessages(
  chatId: string,
  userId: string,
  query: PaginationQuery
) {
  const chat = await Chat.findById(chatId);
  if (!chat) throw new NotFoundError("Chat");

  const expert = await Expert.findOne({ userId });
  const isParticipant =
    chat.userId.toString() === userId ||
    (expert && chat.expertId.toString() === expert._id.toString());

  if (!isParticipant) throw new ForbiddenError();

  return paginate({
    model: Message,
    filter: { chatId },
    query,
    sort: { createdAt: -1 },
  });
}

export async function sendMessage(
  chatId: string,
  senderId: string,
  _senderRoleHint: "user" | "expert",
  content: string,
  messageType: MessageType = MessageType.TEXT,
  imageUrl?: string
): Promise<IMessage> {
  const chat = await Chat.findById(chatId);
  if (!chat) throw new NotFoundError("Chat");
  if (chat.status === ChatStatus.CLOSED) {
    throw new ForbiddenError("Chat is closed");
  }

  if (!content.trim() && !imageUrl) {
    throw new ValidationError("Message content or image is required");
  }

  // Role must come from chat participation — dual-portal staff also have an Expert
  // record, so "has Expert profile" must NOT decide the role (that routed messages
  // to the wrong person and broke staff realtime unread).
  const expert = await Expert.findOne({ userId: senderId });
  let senderRole: "user" | "expert";
  if (chat.userId.toString() === senderId) {
    senderRole = "user";
  } else if (expert && chat.expertId.toString() === expert._id.toString()) {
    senderRole = "expert";
  } else {
    throw new ForbiddenError("Not a participant of this chat");
  }

  const message = await Message.create({
    chatId,
    senderId,
    senderRole,
    content: content.trim(),
    messageType,
    imageUrl,
  });

  chat.lastMessage = messageType === MessageType.IMAGE ? "📷 Image" : content.trim();
  chat.lastMessageAt = new Date();
  await chat.save();

  const payload = {
    chatId,
    message: message.toJSON(),
  };

  // Open thread room (participants who joined this chat)
  emitToChat(chatId, "message:received", payload);

  const recipientId =
    senderRole === "user"
      ? (await Expert.findById(chat.expertId))?.userId?.toString()
      : chat.userId.toString();

  if (recipientId && recipientId !== senderId) {
    // Inbox updates even when recipient has not joined the chat room
    emitToUser(recipientId, "message:received", payload);
    await createNotification(
      recipientId,
      "New message",
      content.trim() ? content.slice(0, 100) : "📷 Image",
      NotificationType.CHAT,
      { chatId }
    );
  }

  return message;
}

export async function markChatAsRead(chatId: string, userId: string): Promise<void> {
  const chat = await Chat.findById(chatId);
  if (!chat) throw new NotFoundError("Chat");

  await Message.updateMany(
    { chatId, senderId: { $ne: userId }, isRead: false },
    { isRead: true, readAt: new Date() }
  );

  emitToChat(chatId, "message:read", { chatId, readBy: userId });
}

export async function closeChat(chatId: string): Promise<void> {
  await Chat.findByIdAndUpdate(chatId, { status: ChatStatus.CLOSED });
}
