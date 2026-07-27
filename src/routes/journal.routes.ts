import { Router } from "express";
import * as journalController from "../controllers/journal.controller.js";
import { authenticate, requireUser, optionalAuth } from "../middlewares/auth.js";
import { validate } from "../middlewares/validate.js";
import {
  createPostSchema,
  updatePostSchema,
  commentSchema,
  feedQuerySchema,
  uploadSignatureQuerySchema,
} from "../validators/journal.validator.js";
import { paginationSchema } from "../validators/user.validator.js";

const router = Router();

router.get("/feed", optionalAuth, validate(feedQuerySchema, "query"), journalController.getFeed);
router.get("/me", authenticate, requireUser, validate(paginationSchema, "query"), journalController.getMyPosts);
router.get(
  "/upload-signature",
  authenticate,
  requireUser,
  validate(uploadSignatureQuerySchema, "query"),
  journalController.getUploadSignature
);
router.post("/", authenticate, requireUser, validate(createPostSchema), journalController.createPost);

router.get("/user/:userId", optionalAuth, validate(paginationSchema, "query"), journalController.getUserPosts);
router.get("/profile/:userId", optionalAuth, journalController.getPublicProfile);

router.get("/:id", optionalAuth, journalController.getPost);
router.put("/:id", authenticate, requireUser, validate(updatePostSchema), journalController.updatePost);
router.delete("/:id", authenticate, requireUser, journalController.deletePost);
router.post("/:id/like", authenticate, requireUser, journalController.toggleLike);
router.get("/:id/comments", optionalAuth, validate(paginationSchema, "query"), journalController.getComments);
router.post("/:id/comments", authenticate, requireUser, validate(commentSchema), journalController.addComment);

export default router;
