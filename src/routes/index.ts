import { Router } from "express";
import authRoutes from "./auth.routes.js";
import userRoutes from "./user.routes.js";
import walletRoutes from "./wallet.routes.js";
import expertRoutes from "./expert.routes.js";
import callRoutes from "./call.routes.js";
import chatRoutes from "./chat.routes.js";
import communityRoutes from "./community.routes.js";
import adminRoutes from "./admin.routes.js";

const router = Router();

router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/wallet", walletRoutes);
router.use("/experts", expertRoutes);
router.use("/calls", callRoutes);
router.use("/chats", chatRoutes);
router.use("/community", communityRoutes);
router.use("/admin", adminRoutes);

export default router;
