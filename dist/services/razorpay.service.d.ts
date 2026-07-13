export declare function createRechargeOrder(userId: string, amount: number, couponCode?: string): Promise<{
    orderId: string;
    amount: number;
    currency: string;
    key: string;
}>;
export declare function verifyPaymentSignature(orderId: string, paymentId: string, signature: string): boolean;
export declare function processPaymentVerification(orderId: string, paymentId: string, signature: string): Promise<{
    balanceAfter: number;
}>;
export declare function handleWebhook(payload: Record<string, unknown>): Promise<void>;
export declare function verifyWebhookSignature(body: string, signature: string): boolean;
//# sourceMappingURL=razorpay.service.d.ts.map