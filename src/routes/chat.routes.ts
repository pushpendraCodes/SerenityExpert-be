import { Router } from "express";
import * as chatController from "../controllers/chat.controller.js";
import { authenticate, requireUser } from "../middlewares/auth.js";
import { validate } from "../middlewares/validate.js";
import { chatImageUpload } from "../middlewares/upload.js";
import {
  startChatSchema,
  sendMessageSchema,
  getMessagesSchema,
} from "../validators/chat.validator.js";
import { paginationSchema } from "../validators/user.validator.js";

const router = Router();

router.use(authenticate, requireUser);

router.get("/", validate(paginationSchema, "query"), chatController.listChats);
router.post("/", validate(startChatSchema), chatController.startChat);
router.get("/:id/messages", validate(getMessagesSchema, "query"), chatController.getMessages);
router.post("/:id/messages", chatImageUpload, validate(sendMessageSchema), chatController.sendMessage);
router.put("/:id/read", chatController.markRead);
router.put("/:id/close", chatController.closeChat);

export default router;
