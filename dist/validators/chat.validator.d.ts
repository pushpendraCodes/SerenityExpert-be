import { z } from "zod";
import { MessageType } from "../types/index.js";
export declare const startChatSchema: z.ZodObject<{
    expertId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    expertId: string;
}, {
    expertId: string;
}>;
export declare const sendMessageSchema: z.ZodObject<{
    content: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    messageType: z.ZodOptional<z.ZodNativeEnum<typeof MessageType>>;
}, "strip", z.ZodTypeAny, {
    content: string;
    messageType?: MessageType | undefined;
}, {
    content?: string | undefined;
    messageType?: MessageType | undefined;
}>;
export declare const getMessagesSchema: z.ZodObject<{
    page: z.ZodOptional<z.ZodNumber>;
    limit: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    limit?: number | undefined;
    page?: number | undefined;
}, {
    limit?: number | undefined;
    page?: number | undefined;
}>;
//# sourceMappingURL=chat.validator.d.ts.map