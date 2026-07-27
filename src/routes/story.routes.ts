import { Router } from "express";
import * as storyController from "../controllers/story.controller.js";
import { authenticate, requireUser } from "../middlewares/auth.js";
import { validate } from "../middlewares/validate.js";
import { createStorySchema, storyUploadQuerySchema } from "../validators/story.validator.js";

const router = Router();

router.use(authenticate, requireUser);

router.get("/feed", storyController.getFeed);
router.get(
  "/upload-signature",
  validate(storyUploadQuerySchema, "query"),
  storyController.getUploadSignature
);
router.post("/", validate(createStorySchema), storyController.create);
router.post("/:id/view", storyController.markViewed);
router.delete("/:id", storyController.remove);

export default router;
