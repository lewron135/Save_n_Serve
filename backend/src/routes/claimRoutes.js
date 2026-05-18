import express from "express";

import {
  claimFood,
  getMyClaims,
  getClaimsByFood,
  confirmPickup,
  cancelClaim,
  rategiver,
} from "../controllers/claimController.js";

import { ratingValidator } from "../validator/claimValidator.js";
import validationMiddleware from "../middleware/validationMiddleware.js";
import authMiddleware from "../middleware/authMiddleware.js";
import roleMiddleware from "../middleware/roleMiddleware.js";

const router = express.Router();

// All claim routes require authentication
router.use(authMiddleware);

// Receiver: view own claims
router.get("/my", getMyClaims);

// giver: view claims on a specific food
router.get("/food/:food_id", roleMiddleware("giver"), getClaimsByFood);

// Receiver: claim a food
router.post("/:food_id", roleMiddleware("receiver"), claimFood);

// Receiver: cancel claim
router.patch("/:claim_id/cancel", roleMiddleware("receiver"), cancelClaim);

// Receiver: rate giver after completed pickup
router.post(
  "/:claim_id/rate",
  roleMiddleware("receiver"),
  ratingValidator,
  validationMiddleware,
  rategiver
);

// giver: confirm pickup
router.patch(
  "/:claim_id/confirm",
  roleMiddleware("giver"),
  confirmPickup
);

export default router;