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
const communityController = __importStar(require("../controllers/community.controller.js"));
const auth_js_1 = require("../middlewares/auth.js");
const validate_js_1 = require("../middlewares/validate.js");
const community_validator_js_1 = require("../validators/community.validator.js");
const router = (0, express_1.Router)();
router.get("/questions", (0, validate_js_1.validate)(community_validator_js_1.listQuestionsSchema, "query"), communityController.listQuestions);
router.get("/questions/:id", communityController.getQuestion);
router.use(auth_js_1.authenticate, auth_js_1.requireUser);
router.get("/my/questions", (0, validate_js_1.validate)(community_validator_js_1.listQuestionsSchema, "query"), communityController.listMyQuestions);
router.post("/questions", (0, validate_js_1.validate)(community_validator_js_1.createQuestionSchema), communityController.createQuestion);
router.put("/questions/:id", (0, validate_js_1.validate)(community_validator_js_1.updateQuestionSchema), communityController.updateQuestion);
router.delete("/questions/:id", communityController.deleteQuestion);
router.post("/questions/:id/like", communityController.toggleLike);
router.post("/questions/:id/comments", (0, validate_js_1.validate)(community_validator_js_1.createCommentSchema), communityController.addComment);
router.post("/comments/:id/reply", (0, validate_js_1.validate)(community_validator_js_1.replyCommentSchema), communityController.replyComment);
router.post("/comments/:id/like", communityController.toggleCommentLike);
router.post("/report", (0, validate_js_1.validate)(community_validator_js_1.reportContentSchema), communityController.reportContent);
exports.default = router;
//# sourceMappingURL=community.routes.js.map