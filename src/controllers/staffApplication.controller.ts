import { Request, Response } from "express";
import * as staffApplicationService from "../services/staffApplication.service.js";
import { sendSuccess, sendCreated, sendPaginated } from "../utils/response.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { getParam } from "../utils/params.js";

export const apply = asyncHandler(async (req: Request, res: Response) => {
  const result = await staffApplicationService.applyForStaff(req.user!._id.toString());
  return sendCreated(res, result, "Staff application created");
});

export const verifyPayment = asyncHandler(async (req: Request, res: Response) => {
  const application = await staffApplicationService.verifyStaffApplicationPayment(
    req.user!._id.toString(),
    req.body
  );
  return sendSuccess(res, application, "Payment verified — pending admin review");
});

export const getMine = asyncHandler(async (req: Request, res: Response) => {
  const application = await staffApplicationService.getMyStaffApplication(
    req.user!._id.toString()
  );
  return sendSuccess(res, application);
});

export const getFee = asyncHandler(async (_req: Request, res: Response) => {
  const amount = await staffApplicationService.getStaffApplicationFee();
  return sendSuccess(res, { amount });
});

export const listApplications = asyncHandler(async (req: Request, res: Response) => {
  const result = await staffApplicationService.listStaffApplications(req.query);
  return sendPaginated(res, result);
});

export const review = asyncHandler(async (req: Request, res: Response) => {
  const result = await staffApplicationService.reviewStaffApplication(
    getParam(req, "id"),
    req.user!._id.toString(),
    {
      approve: Boolean(req.body.approve),
      rejectionReason: req.body.rejectionReason,
      pricePerMinute: req.body.pricePerMinute,
      commissionPercent: req.body.commissionPercent,
    }
  );
  return sendSuccess(
    res,
    result,
    req.body.approve
      ? "Approved — call profile created. User can appear on Chat & Call."
      : "Rejected"
  );
});

/** Create missing Expert records for already-approved applications */
export const syncExperts = asyncHandler(async (_req: Request, res: Response) => {
  const result = await staffApplicationService.syncExpertsFromApprovedApplications();
  return sendSuccess(
    res,
    result,
    `Synced: ${result.expertsCreated} created, ${result.expertsUpdated} updated`
  );
});
