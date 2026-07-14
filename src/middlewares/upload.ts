import multer from "multer";
import { ALLOWED_IMAGE_TYPES, MAX_AVATAR_SIZE, MAX_CHAT_IMAGE_SIZE } from "../utils/constants.js";
import { ValidationError } from "../utils/AppError.js";

const imageFilter = (_req: Express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new ValidationError("Only JPEG, PNG, and WebP images are allowed"));
  }
};

export const avatarUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_AVATAR_SIZE },
  fileFilter: imageFilter,
}).single("avatar");

export const chatImageUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_CHAT_IMAGE_SIZE },
  fileFilter: imageFilter,
}).single("image");

const recordingFilter = (_req: Express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const ok = ["audio/webm", "audio/ogg", "audio/mpeg", "audio/mp4", "video/webm", "application/octet-stream"].includes(
    file.mimetype
  );
  if (ok) cb(null, true);
  else cb(new ValidationError("Only audio/video recording files are allowed"));
};

export const callRecordingUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: recordingFilter,
}).single("recording");
