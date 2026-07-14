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
const callController = __importStar(require("../controllers/call.controller.js"));
const auth_js_1 = require("../middlewares/auth.js");
const validate_js_1 = require("../middlewares/validate.js");
const call_validator_js_1 = require("../validators/call.validator.js");
const upload_js_1 = require("../middlewares/upload.js");
const router = (0, express_1.Router)();
router.use(auth_js_1.authenticate, auth_js_1.requireUser);
router.post("/initiate", (0, validate_js_1.validate)(call_validator_js_1.initiateCallSchema), callController.initiateCall);
router.get("/history", (0, validate_js_1.validate)(call_validator_js_1.callHistorySchema, "query"), callController.getHistory);
router.get("/:id", callController.getCall);
router.post("/:id/accept", callController.acceptCall);
router.post("/:id/reject", callController.rejectCall);
router.post("/:id/end", callController.endCall);
router.post("/:id/rate", (0, validate_js_1.validate)(call_validator_js_1.rateCallSchema), callController.rateCall);
router.post("/:id/recording", upload_js_1.callRecordingUpload, callController.uploadRecording);
exports.default = router;
//# sourceMappingURL=call.routes.js.map