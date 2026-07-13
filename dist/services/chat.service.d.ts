import { MessageType } from "../types/index.js";
import type { PaginationQuery } from "../types/index.js";
import type { IChat } from "../models/Chat.js";
import type { IMessage } from "../models/Message.js";
export declare function getOrCreateChat(userId: string, expertId: string): Promise<IChat>;
export declare function getUserChats(userId: string, isExpert: boolean, query: PaginationQuery): Promise<import("../types/index.js").PaginatedResult<IChat>>;
export declare function getChatMessages(chatId: string, userId: string, query: PaginationQuery): Promise<import("../types/index.js").PaginatedResult<IMessage>>;
export declare function sendMessage(chatId: string, senderId: string, senderRole: "user" | "expert", content: string, messageType?: MessageType, imageUrl?: string): Promise<IMessage>;
export declare function markChatAsRead(chatId: string, userId: string): Promise<void>;
export declare function closeChat(chatId: string): Promise<void>;
//# sourceMappingURL=chat.service.d.ts.map