import { Router } from "express";
import * as userController from "../controllers/user.controller.js";
import { registerLimiter } from "../middlewares/rateLimit.middleware.js";

const router = Router();

/**
 * Password Reset Routes
 */

// Request password reset (public, rate limited)
router.post(
  "/password-reset",
  registerLimiter,
  userController.requestPasswordReset
);

// Confirm password reset (public, rate limited)
router.post(
  "/password-reset/confirm",
  registerLimiter,
  userController.confirmPasswordReset
);

export default router;
