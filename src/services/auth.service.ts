import User from "../models/User.js";
import { verifyOtp } from "./otp.service.js";
import { assertExpertCanLogin, findExpertByMobile } from "./expert.service.js";
import { generateTokenPair, verifyRefreshToken } from "../utils/token.js";
import { generateDummyAvatar, generateDummyUsername } from "../utils/constants.js";
import { normalizePhone, phoneLookupVariants } from "../utils/phone.js";
import { UserRole } from "../types/index.js";
import { AuthError } from "../utils/AppError.js";
import type { IUser } from "../models/User.js";

interface AuthResult {
  user: IUser;
  accessToken: string;
  refreshToken: string;
  isNewUser: boolean;
  expert?: import("../models/Expert.js").IExpert;
}

export async function sendExpertOtp(mobile: string): Promise<string> {
  const phone = normalizePhone(mobile);
  await assertExpertCanLogin(phone);
  const { sendOtp } = await import("./otp.service.js");
  return sendOtp(phone);
}

export async function loginExpertWithOtp(mobile: string, otp: string): Promise<AuthResult> {
  const phone = normalizePhone(mobile);
  const expert = await assertExpertCanLogin(phone);
  await verifyOtp(phone, otp);

  const user = await User.findById(expert.userId);
  if (!user || user.isBlocked) {
    throw new AuthError("Account not found or blocked");
  }

  user.isVerified = true;
  user.lastLoginAt = new Date();
  user.role = UserRole.EXPERT;
  await user.save();

  const tokens = generateTokenPair({ userId: user._id.toString(), role: UserRole.EXPERT });
  user.refreshToken = tokens.refreshToken;
  await user.save();

  return { user, expert, ...tokens, isNewUser: false };
}

export async function loginWithOtp(phone: string, otp: string): Promise<AuthResult> {
  const normalized = normalizePhone(phone);
  const expertAccount = await findExpertByMobile(normalized);
  if (expertAccount) {
    throw new AuthError("This mobile number is registered as an expert. Please use expert login.");
  }

  await verifyOtp(normalized, otp);

  let user = await User.findOne({ phone: { $in: phoneLookupVariants(normalized) } });
  let isNewUser = false;

  if (!user) {
    isNewUser = true;
    user = await User.create({
      phone: normalized,
      name: generateDummyUsername(),
      avatar: generateDummyAvatar(normalized),
      isVerified: true,
      role: UserRole.USER,
    });
  } else {
    user.isVerified = true;
    user.lastLoginAt = new Date();
    if (!user.phone.startsWith("+")) user.phone = normalized;
    await user.save();
  }

  const tokens = generateTokenPair({ userId: user._id.toString(), role: user.role });
  user.refreshToken = tokens.refreshToken;
  await user.save();

  return { user, ...tokens, isNewUser };
}

export async function loginWithGoogle(idToken: string): Promise<AuthResult> {
  const response = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`);
  if (!response.ok) {
    throw new AuthError("Invalid Google token");
  }

  const googleUser = (await response.json()) as {
    sub: string;
    email?: string;
    name?: string;
    picture?: string;
  };

  let user = await User.findOne({ googleId: googleUser.sub });
  let isNewUser = false;

  if (!user && googleUser.email) {
    user = await User.findOne({ email: googleUser.email });
    if (user) {
      user.googleId = googleUser.sub;
      await user.save();
    }
  }

  if (!user) {
    isNewUser = true;
    user = await User.create({
      phone: `google_${googleUser.sub.slice(0, 10)}`,
      name: googleUser.name || generateDummyUsername(),
      email: googleUser.email,
      avatar: googleUser.picture || generateDummyAvatar(googleUser.sub),
      googleId: googleUser.sub,
      isVerified: true,
      role: UserRole.USER,
    });
  } else {
    user.lastLoginAt = new Date();
    await user.save();
  }

  const tokens = generateTokenPair({ userId: user._id.toString(), role: user.role });
  user.refreshToken = tokens.refreshToken;
  await user.save();

  return { user, ...tokens, isNewUser };
}

export async function refreshAccessToken(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
  const decoded = verifyRefreshToken(refreshToken);
  const user = await User.findById(decoded.userId).select("+refreshToken");

  if (!user || user.refreshToken !== refreshToken || user.isBlocked) {
    throw new AuthError("Invalid refresh token");
  }

  const tokens = generateTokenPair({ userId: user._id.toString(), role: user.role });
  user.refreshToken = tokens.refreshToken;
  await user.save();

  return tokens;
}

export async function logout(userId: string): Promise<void> {
  await User.findByIdAndUpdate(userId, { $unset: { refreshToken: 1 } });
}

export async function registerFcmToken(userId: string, token: string): Promise<void> {
  await User.findByIdAndUpdate(userId, { $addToSet: { fcmTokens: token } });
}

export async function removeFcmToken(userId: string, token: string): Promise<void> {
  await User.findByIdAndUpdate(userId, { $pull: { fcmTokens: token } });
}
