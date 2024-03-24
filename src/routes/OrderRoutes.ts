import express from "express";
import { jwtCheck, jwtParse } from "../middleware/auth";
import orderController from "../controllers/orderController";

const router = express.Router();

router.post(
  "/checkout/create-checkout-session",
  jwtCheck,
  jwtParse,
  orderController.createCheckoutSession
);

router.post("/checkout/webhook", orderController.stripeWebhookHandler);

export default router;
