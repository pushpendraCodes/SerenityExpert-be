import { Server as HttpServer } from "http";
import { Server, Socket } from "socket.io";
import type { ServerToClientEvents, ClientToServerEvents, TokenPayload } from "../types/index.js";
export type TypedIO = Server<ClientToServerEvents, ServerToClientEvents>;
export type TypedSocket = Socket<ClientToServerEvents, ServerToClientEvents> & {
    data: {
        user: TokenPayload;
    };
};
export declare const initializeSocket: (httpServer: HttpServer) => TypedIO;
export declare const getIO: () => TypedIO;
/**
 * Emit event to a specific user's room.
 */
export declare const emitToUser: <E extends keyof ServerToClientEvents>(userId: string, event: E, ...args: Parameters<ServerToClientEvents[E]>) => void;
/**
 * Emit event to a chat room.
 */
export declare const emitToChat: <E extends keyof ServerToClientEvents>(chatId: string, event: E, ...args: Parameters<ServerToClientEvents[E]>) => void;
//# sourceMappingURL=socket.d.ts.map