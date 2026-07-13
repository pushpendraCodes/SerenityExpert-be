import { RtcTokenBuilder, RtcRole } from "agora-access-token";

export interface AgoraTokenOptions {
  channelName: string;
  uid: number;
  role?: "publisher" | "subscriber";
  expireTimeInSeconds?: number;
}

/**
 * Generate an Agora RTC token for a user to join a voice channel.
 */
export function generateAgoraToken(options: AgoraTokenOptions): string {
  const {
    channelName,
    uid,
    role = "publisher",
    expireTimeInSeconds = 3600,
  } = options;

  const appId = process.env.AGORA_APP_ID;
  const appCertificate = process.env.AGORA_APP_CERTIFICATE;

  if (!appId || !appCertificate) {
    throw new Error("Agora App ID and Certificate are required");
  }

  const agoraRole = role === "publisher" ? RtcRole.PUBLISHER : RtcRole.SUBSCRIBER;
  const currentTimestamp = Math.floor(Date.now() / 1000);
  const privilegeExpiredTs = currentTimestamp + expireTimeInSeconds;

  return RtcTokenBuilder.buildTokenWithUid(
    appId,
    appCertificate,
    channelName,
    uid,
    agoraRole,
    privilegeExpiredTs
  );
}

/**
 * Generate a unique channel name for a call session.
 */
export function generateChannelName(callId: string): string {
  return `call_${callId}_${Date.now()}`;
}
