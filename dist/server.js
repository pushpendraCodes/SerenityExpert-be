"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const http_1 = __importDefault(require("http"));
const app_js_1 = __importDefault(require("./app.js"));
const db_js_1 = __importDefault(require("./config/db.js"));
const redis_js_1 = require("./config/redis.js");
const socket_js_1 = require("./config/socket.js");
const firebase_js_1 = require("./config/firebase.js");
const cloudinary_js_1 = require("./config/cloudinary.js");
const admin_service_js_1 = require("./services/admin.service.js");
const index_js_1 = require("./jobs/index.js");
const PORT = Number(process.env.PORT) || 5000;
async function bootstrap() {
    await (0, db_js_1.default)();
    await (0, redis_js_1.connectRedis)();
    (0, cloudinary_js_1.configureCloudinary)();
    (0, firebase_js_1.initializeFirebase)();
    await (0, admin_service_js_1.seedDefaultSettings)();
    const httpServer = http_1.default.createServer(app_js_1.default);
    (0, socket_js_1.initializeSocket)(httpServer);
    (0, index_js_1.startScheduledJobs)();
    httpServer.listen(PORT, () => {
        console.log(`🚀 Server running on port ${PORT} [${process.env.NODE_ENV || "development"}]`);
    });
    const shutdown = async (signal) => {
        console.log(`\n${signal} received. Shutting down gracefully...`);
        httpServer.close(() => {
            console.log("HTTP server closed");
            process.exit(0);
        });
    };
    process.on("SIGTERM", () => shutdown("SIGTERM"));
    process.on("SIGINT", () => shutdown("SIGINT"));
}
bootstrap().catch((err) => {
    console.error("Failed to start server:", err);
    process.exit(1);
});
//# sourceMappingURL=server.js.map