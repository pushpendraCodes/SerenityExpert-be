import { Request, Response } from "express";
import Expert from "../models/Expert.js";
import * as chatService from "../services/chat.service.js";
import { uploadImage } from "../services/cloudinary.service.js";
import { sendSuccess, sendCreated, sendPaginated } from "../utils/response.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { getParam } from "../utils/params.js";
import { MessageType } from "../types/index.js";

export const listChats = asyncHandler(async (req: Request, res: Response) => {
  const expert = await Expert.findOne({ userId: req.user!._id });
  const result = await chatService.getUserChats(
    req.user!._id.toString(),
    !!expert,
    req.query
  );
  return sendPaginated(res, result);
});

export const startChat = asyncHandler(async (req: Request, res: Response) => {
  const chat = await chatService.getOrCreateChat(req.user!._id.toString(), req.body.expertId);
  return sendCreated(res, chat, "Chat started");
});

export const getMessages = asyncHandler(async (req: Request, res: Response) => {
  const result = await chatService.getChatMessages(
    getParam(req, "id"),
    req.user!._id.toString(),
    req.query
  );
  return sendPaginated(res, result);
});

export const sendMessage = asyncHandler(async (req: Request, res: Response) => {
  const expert = await Expert.findOne({ userId: req.user!._id });
  const senderRole = expert ? "expert" as const : "user" as const;

  if (!req.file && !req.body.content?.trim()) {
    return res.status(400).json({ success: false, message: "Message content or image is required" });
  }

  let imageUrl: string | undefined;
  if (req.file) {
    const uploaded = await uploadImage(req.file.buffer, "chat", getParam(req, "id"));
    imageUrl = uploaded.url;
  }

  const content = String(req.body.content ?? "").trim();
  const messageType = req.file
    ? MessageType.IMAGE
    : (req.body.messageType || MessageType.TEXT);

  const message = await chatService.sendMessage(
    getParam(req, "id"),
    req.user!._id.toString(),
    senderRole,
    content,
    messageType,
    imageUrl
  );
  return sendCreated(res, message, "Message sent");
});

export const markRead = asyncHandler(async (req: Request, res: Response) => {
  await chatService.markChatAsRead(getParam(req, "id"), req.user!._id.toString());
  return sendSuccess(res, null, "Messages marked as read");
});

export const closeChat = asyncHandler(async (req: Request, res: Response) => {
  await chatService.closeChat(getParam(req, "id"));
  return sendSuccess(res, null, "Chat closed");
});
