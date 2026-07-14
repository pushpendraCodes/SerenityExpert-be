"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_routes_js_1 = __importDefault(require("./auth.routes.js"));
const user_routes_js_1 = __importDefault(require("./user.routes.js"));
const wallet_routes_js_1 = __importDefault(require("./wallet.routes.js"));
const expert_routes_js_1 = __importDefault(require("./expert.routes.js"));
const call_routes_js_1 = __importDefault(require("./call.routes.js"));
const chat_routes_js_1 = __importDefault(require("./chat.routes.js"));
const community_routes_js_1 = __importDefault(require("./community.routes.js"));
const admin_routes_js_1 = __importDefault(require("./admin.routes.js"));
const router = (0, express_1.Router)();
router.use("/auth", auth_routes_js_1.default);
router.use("/users", user_routes_js_1.default);
router.use("/wallet", wallet_routes_js_1.default);
router.use("/experts", expert_routes_js_1.default);
router.use("/calls", call_routes_js_1.default);
router.use("/chats", chat_routes_js_1.default);
router.use("/community", community_routes_js_1.default);
router.use("/admin", admin_routes_js_1.default);
exports.default = router;
//# sourceMappingURL=index.js.map