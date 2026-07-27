import { Request, Response } from "express";
import * as storyService from "../services/story.service.js";
import { getStoryUploadSignature } from "../services/cloudinary.service.js";
import { sendSuccess, sendCreated } from "../utils/response.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { getParam } from "../utils/params.js";

export const getUploadSignature = asyncHandler(async (req: Request, res: Response) => {
  const type = (req.query.type as "image" | "video") || "image";
  const sig = getStoryUploadSignature(type, req.user!._id.toString());
  return sendSuccess(res, sig);
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const story = await storyService.createStory(req.user!._id.toString(), req.body);
  return sendCreated(res, story, "Story created");
});

export const getFeed = asyncHandler(async (req: Request, res: Response) => {
  const groups = await storyService.getStoryFeed(req.user!._id.toString());
  return sendSuccess(res, groups);
});

export const markViewed = asyncHandler(async (req: Request, res: Response) => {
  const story = await storyService.markStoryViewed(
    getParam(req, "id"),
    req.user!._id.toString()
  );
  return sendSuccess(res, story);
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  await storyService.deleteStory(getParam(req, "id"), req.user!._id.toString());
  return sendSuccess(res, null, "Story deleted");
});
