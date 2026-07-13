export interface AgoraTokenOptions {
    channelName: string;
    uid: number;
    role?: "publisher" | "subscriber";
    expireTimeInSeconds?: number;
}
/**
 * Generate an Agora RTC token for a user to join a voice channel.
 */
export declare function generateAgoraToken(options: AgoraTokenOptions): string;
/**
 * Generate a unique channel name for a call session.
 */
export declare function generateChannelName(callId: string): string;
//# sourceMappingURL=agora.d.ts.map