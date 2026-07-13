"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.emitToChat = exports.emitToUser = exports.getIO = exports.initializeSocket = void 0;
const socket_io_1 = require("socket.io");
const token_js_1 = require("../utils/token.js");
let io;
const initializeSocket = (httpServer) => {
    io = new socket_io_1.Server(httpServer, {
        cors: {
            origin: process.env.ALLOWED_ORIGINS === "*" ? "*" : process.env.ALLOWED_ORIGINS?.split(","),
            credentials: true,
        },
        pingTimeout: 60000,
        pingInterval: 25000,
    });
    // ─── Auth Middleware ──────────────────────────────────────────────────────
    io.use((socket, next) => {
        const token = socket.handshake.auth.token;
        if (!token) {
            return next(new Error("Authentication required"));
        }
        try {
            const decoded = (0, token_js_1.verifyAccessToken)(token);
            socket.data = { user: decoded };
            next();
        }
        catch {
            next(new Error("Invalid or expired token"));
        }
    });
    // ─── Connection Handler ───────────────────────────────────────────────────
    io.on("connection", (rawSocket) => {
        const socket = rawSocket;
        const userId = socket.data.user.userId;
        console.log(`🔗 Socket connected: ${userId} (${socket.id})`);
        // Join personal room for direct notifications
        socket.join(`user:${userId}`);
        // ── Chat Events ───────────────────────────────────────────────────────
        socket.on("chat:join", (chatId) => {
            socket.join(`chat:${chatId}`);
            console.log(`💬 User ${userId} joined chat:${chatId}`);
        });
        socket.on("chat:leave", (chatId) => {
            socket.leave(`chat:${chatId}`);
        });
        socket.on("typing:start", (chatId) => {
            socket.to(`chat:${chatId}`).emit("typing:start", { chatId, userId });
        });
        socket.on("typing:stop", (chatId) => {
            socket.to(`chat:${chatId}`).emit("typing:stop", { chatId, userId });
        });
        // ── Expert Status ─────────────────────────────────────────────────────
        socket.on("expert:update-status", (status) => {
            io.emit("expert:status-changed", { expertId: userId, status });
        });
        // ── Disconnect ────────────────────────────────────────────────────────
        socket.on("disconnect", (reason) => {
            console.log(`🔌 Socket disconnected: ${userId} (${reason})`);
        });
    });
    console.log("✅ Socket.IO initialized");
    return io;
};
exports.initializeSocket = initializeSocket;
const getIO = () => {
    if (!io) {
        throw new Error("Socket.IO not initialized. Call initializeSocket() first.");
    }
    return io;
};
exports.getIO = getIO;
/**
 * Emit event to a specific user's room.
 */
const emitToUser = (userId, event, data) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (0, exports.getIO)().to(`user:${userId}`).emit(event, data);
};
exports.emitToUser = emitToUser;
/**
 * Emit event to a chat room.
 */
const emitToChat = (chatId, event, data) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (0, exports.getIO)().to(`chat:${chatId}`).emit(event, data);
};
exports.emitToChat = emitToChat;
//# sourceMappingURL=socket.js.map