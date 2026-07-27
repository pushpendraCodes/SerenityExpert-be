import { Request, Response } from "express";
import * as followService from "../services/follow.service.js";
import { sendSuccess, sendPaginated } from "../utils/response.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { getParam } from "../utils/params.js";

export const follow = asyncHandler(async (req: Request, res: Response) => {
  const followDoc = await followService.followUser(
    req.user!._id.toString(),
    getParam(req, "userId")
  );
  return sendSuccess(res, followDoc, "Followed");
});

export const unfollow = asyncHandler(async (req: Request, res: Response) => {
  await followService.unfollowUser(req.user!._id.toString(), getParam(req, "userId"));
  return sendSuccess(res, null, "Unfollowed");
});

export const getFollowers = asyncHandler(async (req: Request, res: Response) => {
  const result = await followService.getFollowers(getParam(req, "userId"), req.query);
  return sendPaginated(res, result);
});

export const getFollowing = asyncHandler(async (req: Request, res: Response) => {
  const result = await followService.getFollowing(getParam(req, "userId"), req.query);
  return sendPaginated(res, result);
});

export const getCounts = asyncHandler(async (req: Request, res: Response) => {
  const counts = await followService.getFollowCounts(getParam(req, "userId"));
  return sendSuccess(res, counts);
});

export const getMyFollowingStatus = asyncHandler(async (req: Request, res: Response) => {
  const list = await followService.getFollowingWithStatus(req.user!._id.toString());
  return sendSuccess(res, list);
});
