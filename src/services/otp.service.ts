import { getRedisClient } from "../config/redis.js";
import {
  OTP_LENGTH,
  OTP_EXPIRY_MINUTES,
  OTP_MAX_ATTEMPTS,
  OTP_RESEND_COOLDOWN_SECONDS,
} from "../utils/constants.js";
import { AuthError, TooManyRequestsError } from "../utils/AppError.js";

const OTP_PREFIX = "otp:";
const COOLDOWN_PREFIX = "otp:cooldown:";

function generateOtpCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

async function sendSms(phone: string, otp: string): Promise<void> {
  // Pluggable SMS provider — logs in dev, swap with Twilio/MSG91 in production
  if (process.env.NODE_ENV === "production" && process.env.SMS_PROVIDER_URL) {
    // TODO: integrate SMS provider
    console.log(`SMS to ${phone}: OTP ${otp}`);
  } else {
    console.log(`📱 OTP for ${phone}: ${otp}`);
  }
}

export async function sendOtp(phone: string): Promise<string> {
  const redis = getRedisClient();

  const cooldownKey = `${COOLDOWN_PREFIX}${phone}`;
  const onCooldown = await redis.get(cooldownKey);
  if (onCooldown) {
    throw new TooManyRequestsError(`Please wait ${OTP_RESEND_COOLDOWN_SECONDS} seconds before requesting another OTP`);
  }

  const otp = generateOtpCode();
  const key = `${OTP_PREFIX}${phone}`;

  await redis.setEx(key, OTP_EXPIRY_MINUTES * 60, JSON.stringify({ otp, attempts: 0 }));
  await redis.setEx(cooldownKey, OTP_RESEND_COOLDOWN_SECONDS, "1");

  await sendSms(phone, otp);
  return otp;
}

export async function verifyOtp(phone: string, otp: string): Promise<boolean> {
  const redis = getRedisClient();
  const key = `${OTP_PREFIX}${phone}`;
  const data = await redis.get(key);

  if (!data) {
    throw new AuthError("OTP expired or not found");
  }

  const parsed = JSON.parse(data) as { otp: string; attempts: number };

  if (parsed.attempts >= OTP_MAX_ATTEMPTS) {
    await redis.del(key);
    throw new AuthError("Maximum OTP attempts exceeded");
  }

  if (parsed.otp !== otp) {
    parsed.attempts += 1;
    await redis.setEx(key, OTP_EXPIRY_MINUTES * 60, JSON.stringify(parsed));
    throw new AuthError("Invalid OTP");
  }

  await redis.del(key);
  return true;
}

export { OTP_LENGTH };
