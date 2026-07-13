"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const index_js_1 = __importDefault(require("./routes/index.js"));
const rateLimiter_js_1 = require("./middlewares/rateLimiter.js");
const errorHandler_js_1 = require("./middlewares/errorHandler.js");
const app = (0, express_1.default)();
// ─── Security ─────────────────────────────────────────────────────────────────
app.use((0, helmet_1.default)());
// ─── CORS ─────────────────────────────────────────────────────────────────────
const allowedOrigins = process.env.ALLOWED_ORIGINS === "*"
    ? "*"
    : process.env.ALLOWED_ORIGINS?.split(",") || ["http://localhost:3000"];
app.use((0, cors_1.default)({
    origin: allowedOrigins,
    credentials: true,
}));
// ─── Logging ──────────────────────────────────────────────────────────────────
if (process.env.NODE_ENV !== "test") {
    app.use((0, morgan_1.default)(process.env.NODE_ENV === "production" ? "combined" : "dev"));
}
// ─── Body parsers ─────────────────────────────────────────────────────────────
app.use(express_1.default.json({ limit: "10mb" }));
app.use(express_1.default.urlencoded({ extended: true }));
// ─── Rate limiting ────────────────────────────────────────────────────────────
app.use(rateLimiter_js_1.generalLimiter);
// ─── Health Check ─────────────────────────────────────────────────────────────
app.get("/health", (_req, res) => {
    res.json({ success: true, message: "Server is healthy", timestamp: new Date().toISOString() });
});
app.get("/", (_req, res) => {
    res.json({ success: true, message: "Expert Consultant API", version: "1.0.0" });
});
// ─── API Routes ───────────────────────────────────────────────────────────────
app.use("/api", index_js_1.default);
// ─── 404 & Error handlers ─────────────────────────────────────────────────────
app.use(errorHandler_js_1.notFoundHandler);
app.use(errorHandler_js_1.errorHandler);
exports.default = app;
//# sourceMappingURL=app.js.map