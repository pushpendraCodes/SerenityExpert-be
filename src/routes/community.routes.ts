import { Router } from "express";
import * as communityController from "../controllers/community.controller.js";
import { authenticate, requireUser, optionalAuth } from "../middlewares/auth.js";
import { validate } from "../middlewares/validate.js";
import {
  createQuestionSchema,
  updateQuestionSchema,
  createCommentSchema,
  replyCommentSchema,
  reportContentSchema,
  listQuestionsSchema,
} from "../validators/community.validator.js";

const router = Router();

router.get("/questions", validate(listQuestionsSchema, "query"), communityController.listQuestions);
router.get("/questions/:id", communityController.getQuestion);

router.use(authenticate, requireUser);

router.get("/my/questions", validate(listQuestionsSchema, "query"), communityController.listMyQuestions);
router.post("/questions", validate(createQuestionSchema), communityController.createQuestion);
router.put("/questions/:id", validate(updateQuestionSchema), communityController.updateQuestion);
router.delete("/questions/:id", communityController.deleteQuestion);
router.post("/questions/:id/like", communityController.toggleLike);
router.post("/questions/:id/comments", validate(createCommentSchema), communityController.addComment);
router.post("/comments/:id/reply", validate(replyCommentSchema), communityController.replyComment);
router.post("/comments/:id/like", communityController.toggleCommentLike);
router.post("/report", validate(reportContentSchema), communityController.reportContent);

export default router;
