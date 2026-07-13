import { Request, Response } from "express";
import CommunityComment from "../models/CommunityComment.js";
import * as communityService from "../services/community.service.js";
import { sendSuccess, sendCreated, sendPaginated } from "../utils/response.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { getParam } from "../utils/params.js";
import { NotFoundError } from "../utils/AppError.js";

export const createQuestion = asyncHandler(async (req: Request, res: Response) => {
  const question = await communityService.createQuestion(req.user!._id.toString(), req.body);
  return sendCreated(res, question, "Question posted");
});

export const listQuestions = asyncHandler(async (req: Request, res: Response) => {
  const result = await communityService.listQuestions(req.query);
  return sendPaginated(res, result);
});

export const listMyQuestions = asyncHandler(async (req: Request, res: Response) => {
  const result = await communityService.listMyQuestions(req.user!._id.toString(), req.query);
  return sendPaginated(res, result);
});

export const getQuestion = asyncHandler(async (req: Request, res: Response) => {
  const data = await communityService.getQuestionById(getParam(req, "id"));
  return sendSuccess(res, data);
});

export const updateQuestion = asyncHandler(async (req: Request, res: Response) => {
  const question = await communityService.updateQuestion(
    getParam(req, "id"),
    req.user!._id.toString(),
    req.body
  );
  return sendSuccess(res, question, "Question updated");
});

export const deleteQuestion = asyncHandler(async (req: Request, res: Response) => {
  await communityService.deleteQuestion(getParam(req, "id"), req.user!._id.toString());
  return sendSuccess(res, null, "Question deleted");
});

export const toggleLike = asyncHandler(async (req: Request, res: Response) => {
  const result = await communityService.toggleQuestionLike(getParam(req, "id"), req.user!._id.toString());
  return sendSuccess(res, result);
});

export const addComment = asyncHandler(async (req: Request, res: Response) => {
  const comment = await communityService.addComment(
    getParam(req, "id"),
    req.user!._id.toString(),
    req.body.body
  );
  return sendCreated(res, comment, "Comment added");
});

export const replyComment = asyncHandler(async (req: Request, res: Response) => {
  const parentComment = await CommunityComment.findById(getParam(req, "id"));
  if (!parentComment) throw new NotFoundError("Comment");

  const comment = await communityService.addComment(
    parentComment.questionId.toString(),
    req.user!._id.toString(),
    req.body.body,
    getParam(req, "id")
  );
  return sendCreated(res, comment, "Reply added");
});

export const toggleCommentLike = asyncHandler(async (req: Request, res: Response) => {
  const result = await communityService.toggleCommentLike(getParam(req, "id"), req.user!._id.toString());
  return sendSuccess(res, result);
});

export const reportContent = asyncHandler(async (req: Request, res: Response) => {
  const report = await communityService.reportContent(
    req.user!._id.toString(),
    req.body.targetType,
    req.body.targetId,
    req.body.reason,
    req.body.description
  );
  return sendCreated(res, report, "Report submitted");
});
