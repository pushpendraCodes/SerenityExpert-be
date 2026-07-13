export interface ModerationResult {
    isFlagged: boolean;
    reason?: string;
    confidence: number;
}
export declare function moderateContent(text: string): Promise<ModerationResult>;
export declare function ensureContentSafe(text: string, fieldName?: string): Promise<void>;
//# sourceMappingURL=moderation.service.d.ts.map