"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.startScheduledJobs = startScheduledJobs;
const node_cron_1 = __importDefault(require("node-cron"));
const Otp_js_1 = __importDefault(require("../models/Otp.js"));
const call_service_js_1 = require("../services/call.service.js");
const payout_service_js_1 = require("../services/payout.service.js");
function startScheduledJobs() {
    // Cleanup expired OTPs every hour (belt & suspenders with MongoDB TTL)
    node_cron_1.default.schedule("0 * * * *", async () => {
        try {
            const result = await Otp_js_1.default.deleteMany({ expiresAt: { $lt: new Date() } });
            if (result.deletedCount > 0) {
                console.log(`🧹 Cleaned up ${result.deletedCount} expired OTPs`);
            }
        }
        catch (err) {
            console.error("OTP cleanup job failed:", err);
        }
    });
    // Auto-end ringing calls after timeout — every minute
    node_cron_1.default.schedule("* * * * *", async () => {
        try {
            const count = await (0, call_service_js_1.timeoutRingingCalls)();
            if (count > 0) {
                console.log(`📞 Timed out ${count} ringing calls`);
            }
        }
        catch (err) {
            console.error("Call timeout job failed:", err);
        }
    });
    // Weekly expert payouts — every Monday at 6 AM IST (00:30 UTC)
    node_cron_1.default.schedule("30 0 * * 1", async () => {
        try {
            const count = await (0, payout_service_js_1.processWeeklyPayouts)();
            console.log(`💰 Processed ${count} weekly payouts`);
        }
        catch (err) {
            console.error("Weekly payout job failed:", err);
        }
    });
    console.log("✅ Scheduled jobs started");
}
//# sourceMappingURL=index.js.map