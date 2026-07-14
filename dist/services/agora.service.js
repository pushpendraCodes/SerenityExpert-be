"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateChannelName = exports.generateAgoraToken = void 0;
exports.generateUidFromUserId = generateUidFromUserId;
exports.buildCallTokens = buildCallTokens;
const agora_js_1 = require("../config/agora.js");
Object.defineProperty(exports, "generateAgoraToken", { enumerable: true, get: function () { return agora_js_1.generateAgoraToken; } });
Object.defineProperty(exports, "generateChannelName", { enumerable: true, get: function () { return agora_js_1.generateChannelName; } });
function generateUidFromUserId(userId) {
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
        hash = (hash << 5) - hash + userId.charCodeAt(i);
        hash |= 0;
    }
    return Math.abs(hash) % 2147483647 || 1;
}
function buildCallTokens(channelName, userId, expertUserId) {
    return {
        userToken: (0, agora_js_1.generateAgoraToken)({
            channelName,
            uid: generateUidFromUserId(userId),
            role: "publisher",
        }),
        expertToken: (0, agora_js_1.generateAgoraToken)({
            channelName,
            uid: generateUidFromUserId(expertUserId),
            role: "publisher",
        }),
    };
}
//# sourceMappingURL=agora.service.js.map