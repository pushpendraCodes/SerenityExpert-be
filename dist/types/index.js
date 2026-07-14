"use strict";
// ─── Enums ────────────────────────────────────────────────────────────────────
Object.defineProperty(exports, "__esModule", { value: true });
exports.DiscountType = exports.NotificationType = exports.ReportStatus = exports.PayoutStatus = exports.RechargeStatus = exports.TransactionStatus = exports.TransactionType = exports.MessageType = exports.ChatStatus = exports.CallStatus = exports.ExpertStatus = exports.UserRole = void 0;
var UserRole;
(function (UserRole) {
    UserRole["USER"] = "user";
    UserRole["EXPERT"] = "expert";
    UserRole["ADMIN"] = "admin";
})(UserRole || (exports.UserRole = UserRole = {}));
var ExpertStatus;
(function (ExpertStatus) {
    ExpertStatus["ONLINE"] = "online";
    ExpertStatus["OFFLINE"] = "offline";
    ExpertStatus["BUSY"] = "busy";
})(ExpertStatus || (exports.ExpertStatus = ExpertStatus = {}));
var CallStatus;
(function (CallStatus) {
    CallStatus["RINGING"] = "ringing";
    CallStatus["ACTIVE"] = "active";
    CallStatus["COMPLETED"] = "completed";
    CallStatus["MISSED"] = "missed";
    CallStatus["REJECTED"] = "rejected";
    CallStatus["FAILED"] = "failed";
})(CallStatus || (exports.CallStatus = CallStatus = {}));
var ChatStatus;
(function (ChatStatus) {
    ChatStatus["ACTIVE"] = "active";
    ChatStatus["CLOSED"] = "closed";
})(ChatStatus || (exports.ChatStatus = ChatStatus = {}));
var MessageType;
(function (MessageType) {
    MessageType["TEXT"] = "text";
    MessageType["IMAGE"] = "image";
    MessageType["SYSTEM"] = "system";
})(MessageType || (exports.MessageType = MessageType = {}));
var TransactionType;
(function (TransactionType) {
    TransactionType["RECHARGE"] = "recharge";
    TransactionType["DEDUCTION"] = "deduction";
    TransactionType["REFUND"] = "refund";
    TransactionType["PAYOUT"] = "payout";
    TransactionType["ADJUSTMENT"] = "adjustment";
})(TransactionType || (exports.TransactionType = TransactionType = {}));
var TransactionStatus;
(function (TransactionStatus) {
    TransactionStatus["PENDING"] = "pending";
    TransactionStatus["COMPLETED"] = "completed";
    TransactionStatus["FAILED"] = "failed";
})(TransactionStatus || (exports.TransactionStatus = TransactionStatus = {}));
var RechargeStatus;
(function (RechargeStatus) {
    RechargeStatus["CREATED"] = "created";
    RechargeStatus["PAID"] = "paid";
    RechargeStatus["FAILED"] = "failed";
})(RechargeStatus || (exports.RechargeStatus = RechargeStatus = {}));
var PayoutStatus;
(function (PayoutStatus) {
    PayoutStatus["PENDING"] = "pending";
    PayoutStatus["PROCESSING"] = "processing";
    PayoutStatus["COMPLETED"] = "completed";
    PayoutStatus["FAILED"] = "failed";
})(PayoutStatus || (exports.PayoutStatus = PayoutStatus = {}));
var ReportStatus;
(function (ReportStatus) {
    ReportStatus["PENDING"] = "pending";
    ReportStatus["REVIEWED"] = "reviewed";
    ReportStatus["RESOLVED"] = "resolved";
})(ReportStatus || (exports.ReportStatus = ReportStatus = {}));
var NotificationType;
(function (NotificationType) {
    NotificationType["CALL"] = "call";
    NotificationType["CHAT"] = "chat";
    NotificationType["COMMUNITY"] = "community";
    NotificationType["PAYMENT"] = "payment";
    NotificationType["SYSTEM"] = "system";
    NotificationType["PROMO"] = "promo";
})(NotificationType || (exports.NotificationType = NotificationType = {}));
var DiscountType;
(function (DiscountType) {
    DiscountType["PERCENTAGE"] = "percentage";
    DiscountType["FLAT"] = "flat";
})(DiscountType || (exports.DiscountType = DiscountType = {}));
//# sourceMappingURL=index.js.map