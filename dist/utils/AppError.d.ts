export declare class AppError extends Error {
    readonly statusCode: number;
    readonly isOperational: boolean;
    constructor(message: string, statusCode?: number, isOperational?: boolean);
}
export declare class ValidationError extends AppError {
    readonly errors: Record<string, string[]>;
    constructor(message: string, errors?: Record<string, string[]>);
}
export declare class AuthError extends AppError {
    constructor(message?: string);
}
export declare class ForbiddenError extends AppError {
    constructor(message?: string);
}
export declare class NotFoundError extends AppError {
    constructor(resource?: string);
}
export declare class ConflictError extends AppError {
    constructor(message?: string);
}
export declare class TooManyRequestsError extends AppError {
    constructor(message?: string);
}
export declare class InsufficientBalanceError extends AppError {
    constructor(message?: string);
}
//# sourceMappingURL=AppError.d.ts.map