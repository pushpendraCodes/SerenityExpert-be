import { z } from "zod";
import { MessageType } from "../types/index.js";

export const startChatSchema = z.object({
  expertId: z.string().min(1),
});

export const sendMessageSchema = z.object({
  content: z
    .union([z.string(), z.undefined(), z.null()])
    .transform((v) => (v == null ? "" : v))
    .pipe(z.string().max(5000)),
  messageType: z.nativeEnum(MessageType).optional(),
});

export const getMessagesSchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
});
