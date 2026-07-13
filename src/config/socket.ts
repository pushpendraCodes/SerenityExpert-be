import { Server as HttpServer } from "http";
import { Server, Socket } from "socket.io";
import { verifyAccessToken } from "../utils/token.js";
import type { ServerToClientEvents, ClientToServerEvents, TokenPayload } from "../types/index.js";

export type TypedIO = Server<ClientToServerEvents, ServerToClientEvents>;
export type TypedSocket = Socket<ClientToServerEvents, ServerToClientEvents> & {
  data: { user: TokenPayload };
};

let io: TypedIO;

export const initializeSocket = (httpServer: HttpServer): TypedIO => {
  io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer, {
    cors: {
      origin: process.env.ALLOWED_ORIGINS === "*" ? "*" : process.env.ALLOWED_ORIGINS?.split(","),
      credentials: true,
    },
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  // ─── Auth Middleware ──────────────────────────────────────────────────────
  io.use((socket, next) => {
    const token = socket.handshake.auth.token as string;
    if (!token) {
      return next(new Error("Authentication required"));
    }

    try {
      const decoded = verifyAccessToken(token);
      (socket as TypedSocket).data = { user: decoded };
      next();
    } catch {
      next(new Error("Invalid or expired token"));
    }
  });

  // ─── Connection Handler ───────────────────────────────────────────────────
  io.on("connection", (rawSocket) => {
    const socket = rawSocket as TypedSocket;
    const userId = socket.data.user.userId;

    console.log(`🔗 Socket connected: ${userId} (${socket.id})`);

    // Join personal room for direct notifications
    socket.join(`user:${userId}`);

    // ── Chat Events ───────────────────────────────────────────────────────
    socket.on("chat:join", (chatId: string) => {
      socket.join(`chat:${chatId}`);
      console.log(`💬 User ${userId} joined chat:${chatId}`);
    });

    socket.on("chat:leave", (chatId: string) => {
      socket.leave(`chat:${chatId}`);
    });

    socket.on("typing:start", (chatId: string) => {
      socket.to(`chat:${chatId}`).emit("typing:start", { chatId, userId });
    });

    socket.on("typing:stop", (chatId: string) => {
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

export const getIO = (): TypedIO => {
  if (!io) {
    throw new Error("Socket.IO not initialized. Call initializeSocket() first.");
  }
  return io;
};

/**
 * Emit event to a specific user's room.
 */
export const emitToUser = (
  userId: string,
  event: keyof ServerToClientEvents,
  data: Parameters<ServerToClientEvents[typeof event]>[0]
): void => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getIO().to(`user:${userId}`).emit(event, data as any);
};

/**
 * Emit event to a chat room.
 */
export const emitToChat = (
  chatId: string,
  event: keyof ServerToClientEvents,
  data: Parameters<ServerToClientEvents[typeof event]>[0]
): void => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getIO().to(`chat:${chatId}`).emit(event, data as any);
};
