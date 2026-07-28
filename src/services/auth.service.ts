import User from "../models/User.js";
import Expert from "../models/Expert.js";
import { verifyOtp } from "./otp.service.js";
import { assertExpertCanLogin } from "./expert.service.js";
import { generateTokenPair, verifyRefreshToken } from "../utils/token.js";
import { generateDummyAvatar, generateDummyUsername, FREE_SECONDS_ON_SIGNUP } from "../utils/constants.js";
import { normalizePhone, phoneLookupVariants } from "../utils/phone.js";
import { UserRole } from "../types/index.js";
import { AuthError } from "../utils/AppError.js";
import type { IUser } from "../models/User.js";
import type { TokenPayload } from "../types/index.js";

interface AuthResult {
  user: IUser;
  accessToken: string;
  refreshToken: string;
  isNewUser: boolean;
  hasStaffProfile: boolean;
  expert?: import("../models/Expert.js").IExpert;
}

async function resolveHasStaffProfile(userId: string): Promise<boolean> {
  const expert = await Expert.findOne({ userId, isApproved: true }).select("_id");
  return Boolean(expert);
}

async function issueTokens(user: IUser, roleOverride?: UserRole): Promise<{
  accessToken: string;
  refreshToken: string;
  hasStaffProfile: boolean;
}> {
  const hasStaffProfile = await resolveHasStaffProfile(user._id.toString());
  const role = roleOverride ?? user.role;
  const payload: TokenPayload = {
    userId: user._id.toString(),
    role,
    hasStaffProfile,
  };
  const tokens = generateTokenPair(payload);
  user.refreshToken = tokens.refreshToken;
  await user.save();
  return { ...tokens, hasStaffProfile };
}

/** Staff portal OTP — same as expert login; dual-portal friendly */
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

  const user = await User.findById(expert.userId).select("+realName");
  if (!user || user.isBlocked) {
    throw new AuthError("Account not found or blocked");
  }

  user.isVerified = true;
  user.lastLoginAt = new Date();
  // Keep role as USER for dual-portal users; only elevate if already admin stays admin
  if (user.role !== UserRole.ADMIN) {
    // Do not flip identity away from user portal — staff access is via Expert link + hasStaffProfile
  }
  await user.save();

  const tokens = await issueTokens(user, user.role === UserRole.ADMIN ? UserRole.ADMIN : UserRole.USER);

  return {
    user,
    expert,
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
    hasStaffProfile: tokens.hasStaffProfile,
    isNewUser: false,
  };
}

export async function loginWithOtp(phone: string, otp: string): Promise<AuthResult> {
  const normalized = normalizePhone(phone);
  // Dual portal: expert/staff phones may also use the user app — do not block

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
      profileCompleted: false,
      freeSecondsRemaining: FREE_SECONDS_ON_SIGNUP,
    });
  } else {
    user.isVerified = true;
    user.lastLoginAt = new Date();
    if (!user.phone.startsWith("+")) user.phone = normalized;
    await user.save();
  }

  const tokens = await issueTokens(user);

  return {
    user,
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
    hasStaffProfile: tokens.hasStaffProfile,
    isNewUser,
  };
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
      profileCompleted: false,
      freeSecondsRemaining: FREE_SECONDS_ON_SIGNUP,
    });
  } else {
    user.lastLoginAt = new Date();
    await user.save();
  }

  const tokens = await issueTokens(user);

  return {
    user,
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
    hasStaffProfile: tokens.hasStaffProfile,
    isNewUser,
  };
}

export async function refreshAccessToken(refreshToken: string): Promise<{
  accessToken: string;
  refreshToken: string;
  hasStaffProfile: boolean;
}> {
  const decoded = verifyRefreshToken(refreshToken);
  const user = await User.findById(decoded.userId).select("+refreshToken");

  if (!user || user.refreshToken !== refreshToken || user.isBlocked) {
    throw new AuthError("Invalid refresh token");
  }

  return issueTokens(user);
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

export async function completeProfile(
  userId: string,
  data: {
    realName: string;
    dob: string;
    gender: string;
    country: string;
    city: string;
    state: string;
  }
): Promise<IUser> {
  const user = await User.findById(userId);
  if (!user) throw new AuthError("User not found");

  // Real name + DOB are stored privately; the public `name` stays a dummy handle.
  user.realName = data.realName.trim();
  user.dob = new Date(data.dob);
  user.gender = data.gender as IUser["gender"];
  user.country = data.country.trim();
  user.city = data.city.trim();
  user.state = data.state.trim();
  user.profileCompleted = true;
  await user.save();
  return user;
}
