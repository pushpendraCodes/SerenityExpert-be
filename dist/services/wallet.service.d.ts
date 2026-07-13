import { TransactionType } from "../types/index.js";
export declare function getBalance(userId: string): Promise<number>;
export declare function creditWallet(userId: string, amount: number, description: string, meta?: {
    referenceId?: string;
    referenceType?: "call" | "chat" | "recharge" | "payout" | "adjustment";
    razorpayPaymentId?: string;
    razorpayOrderId?: string;
    type?: TransactionType;
}): Promise<{
    balanceAfter: number;
    transactionId: string;
}>;
export declare function debitWallet(userId: string, amount: number, description: string, meta?: {
    referenceId?: string;
    referenceType?: "call" | "chat" | "recharge" | "payout" | "adjustment";
}): Promise<{
    balanceAfter: number;
    transactionId: string;
}>;
export declare function adjustWallet(userId: string, amount: number, type: "credit" | "debit", description: string, adminId: string): Promise<{
    balanceAfter: number;
}>;
/** Per-second billing: cost = (pricePerMinute / 60) * seconds */
export declare function calculateCallCost(pricePerMinute: number, durationSeconds: number): number;
export declare function canAffordCall(balance: number, pricePerMinute: number, minSeconds?: number): boolean;
export declare function minutesRemaining(balance: number, pricePerMinute: number): number;
//# sourceMappingURL=wallet.service.d.ts.map