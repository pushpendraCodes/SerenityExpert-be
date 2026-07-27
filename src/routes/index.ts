import { Router } from "express";
import authRoutes from "./auth.routes.js";
import userRoutes from "./user.routes.js";
import walletRoutes from "./wallet.routes.js";
import expertRoutes from "./expert.routes.js";
import callRoutes from "./call.routes.js";
import chatRoutes from "./chat.routes.js";
import communityRoutes from "./community.routes.js";
import journalRoutes from "./journal.routes.js";
import followRoutes from "./follow.routes.js";
import storyRoutes from "./story.routes.js";
import staffApplicationRoutes from "./staffApplication.routes.js";
import adminRoutes from "./admin.routes.js";

const router = Router();

router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/wallet", walletRoutes);
router.use("/staff", staffApplicationRoutes); // /staff/apply*, /staff/applications* (before /:id)
router.use("/staff", expertRoutes); // Staff browse/profile alias — Expert model under the hood
router.use("/experts", expertRoutes);
router.use("/calls", callRoutes);
router.use("/chats", chatRoutes);
router.use("/journal", journalRoutes);
router.use("/stories", storyRoutes);
router.use("/follow", followRoutes);
router.use("/community", communityRoutes); // Deprecated — remove after FE cutover
router.use("/admin", adminRoutes);

export default router;
