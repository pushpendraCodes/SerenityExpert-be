"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getOrCreateChat = getOrCreateChat;
exports.getUserChats = getUserChats;
exports.getChatMessages = getChatMessages;
exports.sendMessage = sendMessage;
exports.markChatAsRead = markChatAsRead;
exports.closeChat = closeChat;
const mongoose_1 = __importDefault(require("mongoose"));
const Chat_js_1 = __importDefault(require("../models/Chat.js"));
const Message_js_1 = __importDefault(require("../models/Message.js"));
const Expert_js_1 = __importDefault(require("../models/Expert.js"));
const socket_js_1 = require("../config/socket.js");
const notification_service_js_1 = require("./notification.service.js");
const pagination_js_1 = require("../utils/pagination.js");
const index_js_1 = require("../types/index.js");
const AppError_js_1 = require("../utils/AppError.js");
async function getOrCreateChat(userId, expertId) {
    const expert = await Expert_js_1.default.findOne({ _id: expertId, isApproved: true });
    if (!expert) {
        throw new AppError_js_1.NotFoundError("Person");
    }
    // Never allow chatting with yourself (dual-portal staff on user site)
    if (expert.userId.toString() === userId) {
        throw new AppError_js_1.ValidationError("You cannot start a chat with yourself");
    }
    let chat = await Chat_js_1.default.findOne({ userId, expertId });
    if (!chat) {
        chat = await Chat_js_1.default.create({ userId, expertId, status: index_js_1.ChatStatus.ACTIVE });
    }
    const populated = await Chat_js_1.default.findById(chat._id)
        .populate({ path: "userId", select: "name avatar gender" })
        .populate({
        path: "expertId",
        select: "userId status pricePerMinute isApproved",
        populate: { path: "userId", select: "name avatar gender" },
    });
    return (populated || chat);
}
async function getUserChats(userId, isExpert, query) {
    const filter = isExpert
        ? { expertId: (await Expert_js_1.default.findOne({ userId }))?._id }
        : { userId };
    const result = await (0, pagination_js_1.paginate)({
        model: Chat_js_1.default,
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
    const unreadMap = new Map();
    if (chatIds.length > 0) {
        const viewerOid = new mongoose_1.default.Types.ObjectId(userId);
        const unreadRows = await Message_js_1.default.aggregate([
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
            ...chat,
            unreadCount: unreadMap.get(String(chat._id)) || 0,
        })),
    };
}
async function getChatMessages(chatId, userId, query) {
    const chat = await Chat_js_1.default.findById(chatId);
    if (!chat)
        throw new AppError_js_1.NotFoundError("Chat");
    const expert = await Expert_js_1.default.findOne({ userId });
    const isParticipant = chat.userId.toString() === userId ||
        (expert && chat.expertId.toString() === expert._id.toString());
    if (!isParticipant)
        throw new AppError_js_1.ForbiddenError();
    return (0, pagination_js_1.paginate)({
        model: Message_js_1.default,
        filter: { chatId },
        query,
        sort: { createdAt: -1 },
    });
}
async function sendMessage(chatId, senderId, _senderRoleHint, content, messageType = index_js_1.MessageType.TEXT, imageUrl) {
    const chat = await Chat_js_1.default.findById(chatId);
    if (!chat)
        throw new AppError_js_1.NotFoundError("Chat");
    if (chat.status === index_js_1.ChatStatus.CLOSED) {
        throw new AppError_js_1.ForbiddenError("Chat is closed");
    }
    if (!content.trim() && !imageUrl) {
        throw new AppError_js_1.ValidationError("Message content or image is required");
    }
    // Role must come from chat participation — dual-portal staff also have an Expert
    // record, so "has Expert profile" must NOT decide the role (that routed messages
    // to the wrong person and broke staff realtime unread).
    const expert = await Expert_js_1.default.findOne({ userId: senderId });
    let senderRole;
    if (chat.userId.toString() === senderId) {
        senderRole = "user";
    }
    else if (expert && chat.expertId.toString() === expert._id.toString()) {
        senderRole = "expert";
    }
    else {
        throw new AppError_js_1.ForbiddenError("Not a participant of this chat");
    }
    const message = await Message_js_1.default.create({
        chatId,
        senderId,
        senderRole,
        content: content.trim(),
        messageType,
        imageUrl,
    });
    chat.lastMessage = messageType === index_js_1.MessageType.IMAGE ? "📷 Image" : content.trim();
    chat.lastMessageAt = new Date();
    await chat.save();
    const payload = {
        chatId,
        message: message.toJSON(),
    };
    // Open thread room (participants who joined this chat)
    (0, socket_js_1.emitToChat)(chatId, "message:received", payload);
    const recipientId = senderRole === "user"
        ? (await Expert_js_1.default.findById(chat.expertId))?.userId?.toString()
        : chat.userId.toString();
    if (recipientId && recipientId !== senderId) {
        // Inbox updates even when recipient has not joined the chat room
        (0, socket_js_1.emitToUser)(recipientId, "message:received", payload);
        await (0, notification_service_js_1.createNotification)(recipientId, "New message", content.trim() ? content.slice(0, 100) : "📷 Image", index_js_1.NotificationType.CHAT, { chatId });
    }
    return message;
}
async function markChatAsRead(chatId, userId) {
    const chat = await Chat_js_1.default.findById(chatId);
    if (!chat)
        throw new AppError_js_1.NotFoundError("Chat");
    await Message_js_1.default.updateMany({ chatId, senderId: { $ne: userId }, isRead: false }, { isRead: true, readAt: new Date() });
    (0, socket_js_1.emitToChat)(chatId, "message:read", { chatId, readBy: userId });
}
async function closeChat(chatId) {
    await Chat_js_1.default.findByIdAndUpdate(chatId, { status: index_js_1.ChatStatus.CLOSED });
}
//# sourceMappingURL=chat.service.js.map