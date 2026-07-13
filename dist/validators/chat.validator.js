"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMessagesSchema = exports.sendMessageSchema = exports.startChatSchema = void 0;
const zod_1 = require("zod");
const index_js_1 = require("../types/index.js");
exports.startChatSchema = zod_1.z.object({
    expertId: zod_1.z.string().min(1),
});
exports.sendMessageSchema = zod_1.z.object({
    content: zod_1.z
        .union([zod_1.z.string(), zod_1.z.undefined(), zod_1.z.null()])
        .transform((v) => (v == null ? "" : v))
        .pipe(zod_1.z.string().max(5000)),
    messageType: zod_1.z.nativeEnum(index_js_1.MessageType).optional(),
});
exports.getMessagesSchema = zod_1.z.object({
    page: zod_1.z.coerce.number().int().min(1).optional(),
    limit: zod_1.z.coerce.number().int().min(1).max(100).optional(),
});
//# sourceMappingURL=chat.validator.js.map