"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validate = void 0;
const zod_1 = require("zod");
const AppError_js_1 = require("../utils/AppError.js");
/**
 * Express 5 exposes req.query / req.params as getter-only.
 * Reassign via defineProperty after Zod parsing.
 */
function assignRequestPart(req, part, value) {
    if (part === "body") {
        req.body = value;
        return;
    }
    Object.defineProperty(req, part, {
        value,
        writable: true,
        configurable: true,
        enumerable: true,
    });
}
const validate = (schema, part = "body") => {
    return (req, _res, next) => {
        try {
            const parsed = schema.parse(req[part]);
            assignRequestPart(req, part, parsed);
            next();
        }
        catch (err) {
            if (err instanceof zod_1.ZodError) {
                const errors = {};
                err.errors.forEach((e) => {
                    const key = e.path.join(".") || "root";
                    if (!errors[key])
                        errors[key] = [];
                    errors[key].push(e.message);
                });
                throw new AppError_js_1.ValidationError("Validation failed", errors);
            }
            throw err;
        }
    };
};
exports.validate = validate;
//# sourceMappingURL=validate.js.map