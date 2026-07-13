"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getParam = getParam;
exports.getQueryParam = getQueryParam;
/** Safely extract a route param as a string. */
function getParam(req, name) {
    const value = req.params[name];
    return Array.isArray(value) ? value[0] : value;
}
/** Safely extract a query param as a string. */
function getQueryParam(req, name) {
    const value = req.query[name];
    if (Array.isArray(value))
        return String(value[0]);
    if (value === undefined)
        return undefined;
    return String(value);
}
//# sourceMappingURL=params.js.map