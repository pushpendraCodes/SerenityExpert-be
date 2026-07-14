"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadImage = uploadImage;
exports.uploadFromUrl = uploadFromUrl;
exports.deleteAsset = deleteAsset;
exports.uploadRecording = uploadRecording;
const cloudinary_js_1 = __importStar(require("../config/cloudinary.js"));
const AppError_js_1 = require("../utils/AppError.js");
(0, cloudinary_js_1.configureCloudinary)();
async function uploadImage(buffer, folder, filename) {
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary_js_1.default.uploader.upload_stream({
            folder: `expert-consultant/${folder}`,
            public_id: filename,
            resource_type: "image",
            transformation: [{ quality: "auto", fetch_format: "auto" }],
        }, (error, result) => {
            if (error || !result) {
                reject(new AppError_js_1.ValidationError(error?.message || "Upload failed"));
            }
            else {
                resolve({ url: result.secure_url, publicId: result.public_id });
            }
        });
        uploadStream.end(buffer);
    });
}
async function uploadFromUrl(url, folder) {
    const result = await cloudinary_js_1.default.uploader.upload(url, {
        folder: `expert-consultant/${folder}`,
        resource_type: "image",
    });
    return { url: result.secure_url, publicId: result.public_id };
}
async function deleteAsset(publicId) {
    await cloudinary_js_1.default.uploader.destroy(publicId);
}
async function uploadRecording(buffer, callId) {
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary_js_1.default.uploader.upload_stream({
            folder: "expert-consultant/recordings",
            public_id: `call_${callId}`,
            resource_type: "video",
        }, (error, result) => {
            if (error || !result) {
                reject(new AppError_js_1.ValidationError(error?.message || "Recording upload failed"));
            }
            else {
                resolve({ url: result.secure_url, publicId: result.public_id });
            }
        });
        uploadStream.end(buffer);
    });
}
//# sourceMappingURL=cloudinary.service.js.map