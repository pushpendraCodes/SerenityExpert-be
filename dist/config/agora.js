"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateAgoraToken = generateAgoraToken;
exports.generateChannelName = generateChannelName;
const agora_access_token_1 = require("agora-access-token");
/**
 * Generate an Agora RTC token for a user to join a voice channel.
 */
function generateAgoraToken(options) {
    const { channelName, uid, role = "publisher", expireTimeInSeconds = 3600, } = options;
    const appId = process.env.AGORA_APP_ID;
    const appCertificate = process.env.AGORA_APP_CERTIFICATE;
    if (!appId || !appCertificate) {
        throw new Error("Agora App ID and Certificate are required");
    }
    const agoraRole = role === "publisher" ? agora_access_token_1.RtcRole.PUBLISHER : agora_access_token_1.RtcRole.SUBSCRIBER;
    const currentTimestamp = Math.floor(Date.now() / 1000);
    const privilegeExpiredTs = currentTimestamp + expireTimeInSeconds;
    return agora_access_token_1.RtcTokenBuilder.buildTokenWithUid(appId, appCertificate, channelName, uid, agoraRole, privilegeExpiredTs);
}
/**
 * Generate a unique channel name for a call session.
 */
function generateChannelName(callId) {
    return `call_${callId}_${Date.now()}`;
}
//# sourceMappingURL=agora.js.map