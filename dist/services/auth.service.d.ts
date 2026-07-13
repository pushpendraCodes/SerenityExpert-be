import type { IUser } from "../models/User.js";
interface AuthResult {
    user: IUser;
    accessToken: string;
    refreshToken: string;
    isNewUser: boolean;
}
export declare function loginWithOtp(phone: string, otp: string): Promise<AuthResult>;
export declare function loginWithGoogle(idToken: string): Promise<AuthResult>;
export declare function refreshAccessToken(refreshToken: string): Promise<{
    accessToken: string;
    refreshToken: string;
}>;
export declare function logout(userId: string): Promise<void>;
export declare function registerFcmToken(userId: string, token: string): Promise<void>;
export declare function removeFcmToken(userId: string, token: string): Promise<void>;
export {};
//# sourceMappingURL=auth.service.d.ts.map