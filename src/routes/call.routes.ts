import { Router } from "express";
import * as callController from "../controllers/call.controller.js";
import { authenticate, requireUser } from "../middlewares/auth.js";
import { validate } from "../middlewares/validate.js";
import {
  initiateCallSchema,
  rateCallSchema,
  callHistorySchema,
} from "../validators/call.validator.js";
import { callRecordingUpload } from "../middlewares/upload.js";

const router = Router();

router.use(authenticate, requireUser);

router.post("/initiate", validate(initiateCallSchema), callController.initiateCall);
router.get("/history", validate(callHistorySchema, "query"), callController.getHistory);
router.get("/:id", callController.getCall);
router.post("/:id/accept", callController.acceptCall);
router.post("/:id/reject", callController.rejectCall);
router.post("/:id/end", callController.endCall);
router.post("/:id/rate", validate(rateCallSchema), callController.rateCall);
router.post("/:id/recording", callRecordingUpload, callController.uploadRecording);

export default router;
