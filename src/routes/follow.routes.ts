import { Router } from "express";
import * as followController from "../controllers/follow.controller.js";
import { authenticate, requireUser } from "../middlewares/auth.js";
import { validate } from "../middlewares/validate.js";
import { paginationSchema } from "../validators/user.validator.js";

const router = Router();

router.get(
  "/me/following-status",
  authenticate,
  requireUser,
  followController.getMyFollowingStatus
);
router.post("/:userId", authenticate, requireUser, followController.follow);
router.delete("/:userId", authenticate, requireUser, followController.unfollow);
router.get("/:userId/followers", validate(paginationSchema, "query"), followController.getFollowers);
router.get("/:userId/following", validate(paginationSchema, "query"), followController.getFollowing);
router.get("/:userId/counts", followController.getCounts);

export default router;
