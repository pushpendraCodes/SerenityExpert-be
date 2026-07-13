"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.chatImageUpload = exports.avatarUpload = void 0;
const multer_1 = __importDefault(require("multer"));
const constants_js_1 = require("../utils/constants.js");
const AppError_js_1 = require("../utils/AppError.js");
const imageFilter = (_req, file, cb) => {
    if (constants_js_1.ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
        cb(null, true);
    }
    else {
        cb(new AppError_js_1.ValidationError("Only JPEG, PNG, and WebP images are allowed"));
    }
};
exports.avatarUpload = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
    limits: { fileSize: constants_js_1.MAX_AVATAR_SIZE },
    fileFilter: imageFilter,
}).single("avatar");
exports.chatImageUpload = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
    limits: { fileSize: constants_js_1.MAX_CHAT_IMAGE_SIZE },
    fileFilter: imageFilter,
}).single("image");
//# sourceMappingURL=upload.js.map