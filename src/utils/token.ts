import jwt, { type SignOptions } from "jsonwebtoken";
import type { TokenPayload } from "../types/index.js";

const accessExpiresIn = (process.env.ACCESS_TOKEN_EXPIRE || "30m") as SignOptions["expiresIn"];
const refreshExpiresIn = (process.env.REFRESH_TOKEN_EXPIRE || "7d") as SignOptions["expiresIn"];

/**
 * Generate a JWT access token.
 */
export function generateAccessToken(payload: TokenPayload): string {
  return jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET, {
    expiresIn: accessExpiresIn,
  });
}

/**
 * Generate a JWT refresh token.
 */
export function generateRefreshToken(payload: TokenPayload): string {
  return jwt.sign(payload, process.env.REFRESH_TOKEN_SECRET, {
    expiresIn: refreshExpiresIn,
  });
}

/**
 * Verify and decode an access token.
 */
export function verifyAccessToken(token: string): TokenPayload {
  return jwt.verify(token, process.env.ACCESS_TOKEN_SECRET) as TokenPayload;
}

/**
 * Verify and decode a refresh token.
 */
export function verifyRefreshToken(token: string): TokenPayload {
  return jwt.verify(token, process.env.REFRESH_TOKEN_SECRET) as TokenPayload;
}

/**
 * Generate both access and refresh tokens.
 */
export function generateTokenPair(payload: TokenPayload): { accessToken: string; refreshToken: string } {
  return {
    accessToken: generateAccessToken(payload),
    refreshToken: generateRefreshToken(payload),
  };
}
