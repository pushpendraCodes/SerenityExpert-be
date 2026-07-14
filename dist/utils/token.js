"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateAccessToken = generateAccessToken;
exports.generateRefreshToken = generateRefreshToken;
exports.verifyAccessToken = verifyAccessToken;
exports.verifyRefreshToken = verifyRefreshToken;
exports.generateTokenPair = generateTokenPair;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const accessExpiresIn = (process.env.ACCESS_TOKEN_EXPIRE || "30m");
const refreshExpiresIn = (process.env.REFRESH_TOKEN_EXPIRE || "7d");
/**
 * Generate a JWT access token.
 */
function generateAccessToken(payload) {
    return jsonwebtoken_1.default.sign(payload, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: accessExpiresIn,
    });
}
/**
 * Generate a JWT refresh token.
 */
function generateRefreshToken(payload) {
    return jsonwebtoken_1.default.sign(payload, process.env.REFRESH_TOKEN_SECRET, {
        expiresIn: refreshExpiresIn,
    });
}
/**
 * Verify and decode an access token.
 */
function verifyAccessToken(token) {
    return jsonwebtoken_1.default.verify(token, process.env.ACCESS_TOKEN_SECRET);
}
/**
 * Verify and decode a refresh token.
 */
function verifyRefreshToken(token) {
    return jsonwebtoken_1.default.verify(token, process.env.REFRESH_TOKEN_SECRET);
}
/**
 * Generate both access and refresh tokens.
 */
function generateTokenPair(payload) {
    return {
        accessToken: generateAccessToken(payload),
        refreshToken: generateRefreshToken(payload),
    };
}
//# sourceMappingURL=token.js.map