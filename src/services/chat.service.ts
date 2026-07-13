import Chat from "../models/Chat.js";
import Message from "../models/Message.js";
import Expert from "../models/Expert.js";
import { emitToChat } from "../config/socket.js";
import { createNotification } from "./notification.service.js";
import { paginate } from "../utils/pagination.js";
import { ChatStatus, MessageType, NotificationType } from "../types/index.js";
import { NotFoundError, ForbiddenError, ValidationError } from "../utils/AppError.js";
import type { PaginationQuery } from "../types/index.js";
import type { IChat } from "../models/Chat.js";
import type { IMessage } from "../models/Message.js";

export async function getOrCreateChat(userId: string, expertId: string): Promise<IChat> {
  let chat = await Chat.findOne({ userId, expertId });
  if (!chat) {
    chat = await Chat.create({ userId, expertId, status: ChatStatus.ACTIVE });
  }
  return chat;
}

export async function getUserChats(userId: string, isExpert: boolean, query: PaginationQuery) {
  const filter = isExpert
    ? { expertId: (await Expert.findOne({ userId }))?._id }
    : { userId };

  return paginate({
    model: Chat,
    filter,
    query,
    populate: isExpert
      ? { path: "userId", select: "name avatar" }
      : { path: "expertId", populate: { path: "userId", select: "name avatar" } },
    sort: { lastMessageAt: -1, updatedAt: -1 },
  });
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
  senderRole: "user" | "expert",
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

  emitToChat(chatId, "message:received", {
    chatId,
    message: message.toJSON(),
  });

  const recipientId = senderRole === "user"
    ? (await Expert.findById(chat.expertId))?.userId?.toString()
    : chat.userId.toString();

  if (recipientId) {
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
