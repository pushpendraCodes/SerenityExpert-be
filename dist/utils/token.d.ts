import type { TokenPayload } from "../types/index.js";
/**
 * Generate a JWT access token.
 */
export declare function generateAccessToken(payload: TokenPayload): string;
/**
 * Generate a JWT refresh token.
 */
export declare function generateRefreshToken(payload: TokenPayload): string;
/**
 * Verify and decode an access token.
 */
export declare function verifyAccessToken(token: string): TokenPayload;
/**
 * Verify and decode a refresh token.
 */
export declare function verifyRefreshToken(token: string): TokenPayload;
/**
 * Generate both access and refresh tokens.
 */
export declare function generateTokenPair(payload: TokenPayload): {
    accessToken: string;
    refreshToken: string;
};
//# sourceMappingURL=token.d.ts.map