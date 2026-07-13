import type { ICall } from "../models/Call.js";
export declare function initiateCall(userId: string, expertId: string): Promise<{
    call: ICall;
    agoraToken: string;
    channelName: string;
}>;
export declare function acceptCall(callId: string, expertUserId: string): Promise<{
    call: ICall;
    agoraToken: string;
    channelName: string;
}>;
export declare function rejectCall(callId: string, expertUserId: string): Promise<ICall>;
export declare function endCall(callId: string, endedByUserId: string, reason?: "completed" | "low_balance" | "expert_ended" | "user_ended" | "force_ended"): Promise<ICall>;
export declare function rateCall(callId: string, userId: string, rating: number, review?: string): Promise<ICall>;
export declare function getLiveCalls(): Promise<ICall[]>;
export declare function timeoutRingingCalls(): Promise<number>;
//# sourceMappingURL=call.service.d.ts.map