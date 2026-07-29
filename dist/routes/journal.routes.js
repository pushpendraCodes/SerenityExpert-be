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
const express_1 = require("express");
const journalController = __importStar(require("../controllers/journal.controller.js"));
const auth_js_1 = require("../middlewares/auth.js");
const validate_js_1 = require("../middlewares/validate.js");
const journal_validator_js_1 = require("../validators/journal.validator.js");
const user_validator_js_1 = require("../validators/user.validator.js");
const router = (0, express_1.Router)();
router.get("/feed", auth_js_1.optionalAuth, (0, validate_js_1.validate)(journal_validator_js_1.feedQuerySchema, "query"), journalController.getFeed);
router.get("/me", auth_js_1.authenticate, auth_js_1.requireUser, (0, validate_js_1.validate)(journal_validator_js_1.myPostsQuerySchema, "query"), journalController.getMyPosts);
router.get("/upload-signature", auth_js_1.authenticate, auth_js_1.requireUser, (0, validate_js_1.validate)(journal_validator_js_1.uploadSignatureQuerySchema, "query"), journalController.getUploadSignature);
router.post("/", auth_js_1.authenticate, auth_js_1.requireUser, (0, validate_js_1.validate)(journal_validator_js_1.createPostSchema), journalController.createPost);
router.get("/user/:userId", auth_js_1.optionalAuth, (0, validate_js_1.validate)(user_validator_js_1.paginationSchema, "query"), journalController.getUserPosts);
router.get("/profile/:userId", auth_js_1.optionalAuth, journalController.getPublicProfile);
router.get("/:id", auth_js_1.optionalAuth, journalController.getPost);
router.put("/:id", auth_js_1.authenticate, auth_js_1.requireUser, (0, validate_js_1.validate)(journal_validator_js_1.updatePostSchema), journalController.updatePost);
router.delete("/:id", auth_js_1.authenticate, auth_js_1.requireUser, journalController.deletePost);
router.post("/:id/like", auth_js_1.authenticate, auth_js_1.requireUser, journalController.toggleLike);
router.get("/:id/comments", auth_js_1.optionalAuth, (0, validate_js_1.validate)(user_validator_js_1.paginationSchema, "query"), journalController.getComments);
router.post("/:id/comments", auth_js_1.authenticate, auth_js_1.requireUser, (0, validate_js_1.validate)(journal_validator_js_1.commentSchema), journalController.addComment);
exports.default = router;
//# sourceMappingURL=journal.routes.js.map