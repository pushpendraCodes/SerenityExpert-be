import { Request, Response } from "express";
import * as journalService from "../services/journal.service.js";
import { getFeedUploadSignature } from "../services/cloudinary.service.js";
import { sendSuccess, sendCreated, sendPaginated } from "../utils/response.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { getParam } from "../utils/params.js";
import { JournalVisibility, JournalMediaType } from "../types/index.js";

export const getUploadSignature = asyncHandler(async (req: Request, res: Response) => {
  const type = (req.query.type as "image" | "video") || "image";
  const sig = getFeedUploadSignature(type, req.user!._id.toString());
  return sendSuccess(res, sig);
});

export const createPost = asyncHandler(async (req: Request, res: Response) => {
  const post = await journalService.createPost(req.user!._id.toString(), {
    body: req.body.body,
    visibility: req.body.visibility as JournalVisibility,
    mediaType: req.body.mediaType as JournalMediaType | undefined,
    media: req.body.media,
  });
  return sendCreated(res, post, "Post created");
});

export const updatePost = asyncHandler(async (req: Request, res: Response) => {
  const post = await journalService.updatePost(
    getParam(req, "id"),
    req.user!._id.toString(),
    req.body
  );
  return sendSuccess(res, post, "Post updated");
});

export const deletePost = asyncHandler(async (req: Request, res: Response) => {
  await journalService.deletePost(getParam(req, "id"), req.user!._id.toString());
  return sendSuccess(res, null, "Post deleted");
});

export const getFeed = asyncHandler(async (req: Request, res: Response) => {
  const discoverRaw = req.query.discover as unknown;
  const discover = discoverRaw === true || discoverRaw === "true" || discoverRaw === "1";
  const userId = req.user?._id?.toString();
  const result = await journalService.getFeed(userId, {
    page: req.query.page ? Number(req.query.page) : undefined,
    limit: req.query.limit ? Number(req.query.limit) : undefined,
    discover: userId ? discover : true,
  });
  return sendPaginated(res, result);
});

export const getMyPosts = asyncHandler(async (req: Request, res: Response) => {
  const visibility = typeof req.query.visibility === "string" ? req.query.visibility : undefined;
  const result = await journalService.getMyPosts(req.user!._id.toString(), {
    ...req.query,
    visibility,
  });
  return sendPaginated(res, result);
});

export const getUserPosts = asyncHandler(async (req: Request, res: Response) => {
  const result = await journalService.getUserPublicPosts(getParam(req, "userId"), req.query);
  return sendPaginated(res, result);
});

export const getPost = asyncHandler(async (req: Request, res: Response) => {
  const post = await journalService.getPostById(
    getParam(req, "id"),
    req.user?._id?.toString()
  );
  return sendSuccess(res, post);
});

export const toggleLike = asyncHandler(async (req: Request, res: Response) => {
  const post = await journalService.toggleLike(getParam(req, "id"), req.user!._id.toString());
  return sendSuccess(res, post);
});

export const addComment = asyncHandler(async (req: Request, res: Response) => {
  const comment = await journalService.addComment(
    getParam(req, "id"),
    req.user!._id.toString(),
    req.body.body,
    req.body.parentCommentId
  );
  return sendCreated(res, comment, "Comment added");
});

export const getComments = asyncHandler(async (req: Request, res: Response) => {
  const result = await journalService.getComments(
    getParam(req, "id"),
    req.user?._id?.toString(),
    req.query
  );
  return sendPaginated(res, result);
});

export const getPublicProfile = asyncHandler(async (req: Request, res: Response) => {
  const profile = await journalService.getPublicProfile(
    getParam(req, "userId"),
    req.user?._id?.toString()
  );
  return sendSuccess(res, profile);
});
