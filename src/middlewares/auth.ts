import { Request, Response, NextFunction } from "express";
import User from "../models/User.js";
import Expert from "../models/Expert.js";
import { verifyAccessToken } from "../utils/token.js";
import { AuthError, ForbiddenError } from "../utils/AppError.js";
import { UserRole } from "../types/index.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const authenticate = asyncHandler(async (req: Request, _res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    throw new AuthError();
  }

  const token = authHeader.split(" ")[1];
  const decoded = verifyAccessToken(token);

  const user = await User.findById(decoded.userId);
  if (!user || user.isBlocked) {
    throw new AuthError("Account not found or blocked");
  }

  req.user = user;
  next();
});

export const requireUser = asyncHandler(async (req: Request, _res: Response, next: NextFunction) => {
  if (!req.user) throw new AuthError();
  next();
});

export const requireExpert = asyncHandler(async (req: Request, _res: Response, next: NextFunction) => {
  if (!req.user) throw new AuthError();

  const expert = await Expert.findOne({ userId: req.user._id });
  if (!expert) {
    throw new ForbiddenError("Expert profile required");
  }

  req.expert = expert;
  next();
});

export const requireApprovedExpert = asyncHandler(async (req: Request, _res: Response, next: NextFunction) => {
  if (!req.expert?.isApproved) {
    throw new ForbiddenError("Expert account not approved");
  }
  next();
});

export const requireAdmin = asyncHandler(async (req: Request, _res: Response, next: NextFunction) => {
  if (!req.user || req.user.role !== UserRole.ADMIN) {
    throw new ForbiddenError("Admin access required");
  }
  next();
});

export const optionalAuth = asyncHandler(async (req: Request, _res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return next();
  }

  try {
    const token = authHeader.split(" ")[1];
    const decoded = verifyAccessToken(token);
    const user = await User.findById(decoded.userId);
    if (user && !user.isBlocked) {
      req.user = user;
    }
  } catch {
    // Ignore invalid token for optional auth
  }
  next();
});
