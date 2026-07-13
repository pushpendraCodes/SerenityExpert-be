import { Router } from "express";
import * as walletController from "../controllers/wallet.controller.js";
import { authenticate, requireUser } from "../middlewares/auth.js";
import { validate } from "../middlewares/validate.js";
import {
  rechargeWalletSchema,
  verifyPaymentSchema,
  paginationSchema,
} from "../validators/user.validator.js";

const router = Router();

router.post("/webhook", walletController.webhook);

router.use(authenticate, requireUser);

router.post("/recharge", validate(rechargeWalletSchema), walletController.createRecharge);
router.post("/verify", validate(verifyPaymentSchema), walletController.verifyPayment);
router.get("/transactions", validate(paginationSchema, "query"), walletController.getTransactions);

export default router;
