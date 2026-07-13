import { generateAgoraToken, generateChannelName } from "../config/agora.js";
export { generateAgoraToken, generateChannelName };
export declare function generateUidFromUserId(userId: string): number;
export declare function buildCallTokens(channelName: string, userId: string, expertUserId: string): {
    userToken: string;
    expertToken: string;
};
//# sourceMappingURL=agora.service.d.ts.map