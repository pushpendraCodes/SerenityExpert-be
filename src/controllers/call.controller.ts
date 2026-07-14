import { Request, Response } from "express";
import Call from "../models/Call.js";
import * as callService from "../services/call.service.js";
import { sendSuccess, sendCreated, sendPaginated } from "../utils/response.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { getParam } from "../utils/params.js";
import { paginate } from "../utils/pagination.js";
import Expert from "../models/Expert.js";

export const initiateCall = asyncHandler(async (req: Request, res: Response) => {
  const result = await callService.initiateCall(req.user!._id.toString(), req.body.expertId);
  return sendCreated(res, {
    call: result.call,
    agoraToken: result.agoraToken,
    channelName: result.channelName,
  }, "Call initiated");
});

export const acceptCall = asyncHandler(async (req: Request, res: Response) => {
  const result = await callService.acceptCall(getParam(req, "id"), req.user!._id.toString());
  return sendSuccess(res, {
    call: result.call,
    agoraToken: result.agoraToken,
    channelName: result.channelName,
  }, "Call accepted");
});

export const rejectCall = asyncHandler(async (req: Request, res: Response) => {
  const call = await callService.rejectCall(getParam(req, "id"), req.user!._id.toString());
  return sendSuccess(res, call, "Call rejected");
});

export const endCall = asyncHandler(async (req: Request, res: Response) => {
  const expert = await Expert.findOne({ userId: req.user!._id });
  const reason = expert ? "expert_ended" : "user_ended";
  const call = await callService.endCall(getParam(req, "id"), req.user!._id.toString(), reason);
  return sendSuccess(res, call, "Call ended");
});

export const getCall = asyncHandler(async (req: Request, res: Response) => {
  const call = await Call.findById(getParam(req, "id"))
    .populate("userId", "name avatar")
    .populate({ path: "expertId", populate: { path: "userId", select: "name avatar" } });
  return sendSuccess(res, call);
});

export const getHistory = asyncHandler(async (req: Request, res: Response) => {
  const expert = await Expert.findOne({ userId: req.user!._id });
  const filter = expert
    ? { expertId: expert._id }
    : { userId: req.user!._id };

  const result = await paginate({
    model: Call,
    filter,
    query: req.query,
    populate: expert
      ? { path: "userId", select: "name avatar" }
      : { path: "expertId", populate: { path: "userId", select: "name avatar" } },
    sort: { createdAt: -1 },
  });
  return sendPaginated(res, result);
});

export const rateCall = asyncHandler(async (req: Request, res: Response) => {
  const call = await callService.rateCall(
    getParam(req, "id"),
    req.user!._id.toString(),
    req.body.rating,
    req.body.review
  );
  return sendSuccess(res, call, "Call rated successfully");
});

export const uploadRecording = asyncHandler(async (req: Request, res: Response) => {
  if (!req.file) {
    return sendSuccess(res, null, "No recording file");
  }
  const call = await callService.saveCallRecording(
    getParam(req, "id"),
    req.user!._id.toString(),
    req.file.buffer
  );
  return sendSuccess(res, call, "Recording saved");
});
