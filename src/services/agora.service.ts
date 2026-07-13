import { generateAgoraToken, generateChannelName } from "../config/agora.js";

export { generateAgoraToken, generateChannelName };

export function generateUidFromUserId(userId: string): number {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = (hash << 5) - hash + userId.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash) % 2147483647 || 1;
}

export function buildCallTokens(channelName: string, userId: string, expertUserId: string) {
  return {
    userToken: generateAgoraToken({
      channelName,
      uid: generateUidFromUserId(userId),
      role: "publisher",
    }),
    expertToken: generateAgoraToken({
      channelName,
      uid: generateUidFromUserId(expertUserId),
      role: "publisher",
    }),
  };
}
