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
const mongoose_1 = __importStar(require("mongoose"));
const communityQuestionSchema = new mongoose_1.Schema({
    authorId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true,
    },
    authorName: {
        type: String,
        required: true,
    },
    isAnonymous: {
        type: Boolean,
        default: false,
    },
    title: {
        type: String,
        required: true,
        trim: true,
        maxlength: 300,
    },
    slug: {
        type: String,
        unique: true,
        sparse: true,
        index: true,
        trim: true,
    },
    body: {
        type: String,
        required: true,
        maxlength: 5000,
    },
    category: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "Category",
        required: true,
        index: true,
    },
    tags: {
        type: [String],
        default: [],
    },
    likes: [{
            type: mongoose_1.Schema.Types.ObjectId,
            ref: "User",
        }],
    likesCount: {
        type: Number,
        default: 0,
    },
    commentsCount: {
        type: Number,
        default: 0,
    },
    isModerated: {
        type: Boolean,
        default: false,
    },
    isFlagged: {
        type: Boolean,
        default: false,
    },
    isDeleted: {
        type: Boolean,
        default: false,
    },
}, {
    timestamps: true,
    toJSON: {
        transform(_doc, ret) {
            Reflect.deleteProperty(ret, "__v");
            return ret;
        },
    },
});
communityQuestionSchema.index({ createdAt: -1 });
communityQuestionSchema.index({ isFlagged: 1 });
communityQuestionSchema.index({ title: "text", body: "text" });
const CommunityQuestion = mongoose_1.default.model("CommunityQuestion", communityQuestionSchema);
exports.default = CommunityQuestion;
//# sourceMappingURL=CommunityQuestion.js.map