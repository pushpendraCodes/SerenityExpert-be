import cron from "node-cron";
import Otp from "../models/Otp.js";
import { timeoutRingingCalls, timeoutStaleActiveCalls } from "../services/call.service.js";
import { processWeeklyPayouts } from "../services/payout.service.js";
import { runRetentionCleanup } from "../services/retention.service.js";

export function startScheduledJobs(): void {
  // Cleanup expired OTPs every hour (belt & suspenders with MongoDB TTL)
  cron.schedule("0 * * * *", async () => {
    try {
      const result = await Otp.deleteMany({ expiresAt: { $lt: new Date() } });
      if (result.deletedCount > 0) {
        console.log(`🧹 Cleaned up ${result.deletedCount} expired OTPs`);
      }
    } catch (err) {
      console.error("OTP cleanup job failed:", err);
    }
  });

  // Auto-end ringing / stale active calls — every minute
  cron.schedule("* * * * *", async () => {
    try {
      const ringing = await timeoutRingingCalls();
      if (ringing > 0) {
        console.log(`📞 Timed out ${ringing} ringing calls`);
      }
      const stale = await timeoutStaleActiveCalls();
      if (stale > 0) {
        console.log(`📞 Force-ended ${stale} stale active calls`);
      }
    } catch (err) {
      console.error("Call timeout job failed:", err);
    }
  });

  // Weekly expert payouts — every Monday at 6 AM IST (00:30 UTC)
  cron.schedule("30 0 * * 1", async () => {
    try {
      const count = await processWeeklyPayouts();
      console.log(`💰 Processed ${count} weekly payouts`);
    } catch (err) {
      console.error("Weekly payout job failed:", err);
    }
  });

  // Data retention — chats, notifications, call recordings (daily 3:00 AM IST = 21:30 UTC)
  cron.schedule("30 21 * * *", async () => {
    try {
      console.log("🧹 Running data retention cleanup…");
      await runRetentionCleanup();
    } catch (err) {
      console.error("Retention cleanup job failed:", err);
    }
  });

  console.log("✅ Scheduled jobs started");
}
