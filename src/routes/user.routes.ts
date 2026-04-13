import { Router } from "express";
import * as userController from "../controllers/user.controller.js";
import protect from "../middlewares/auth.middleware.js";
import { registerLimiter } from "../middlewares/rateLimit.middleware.js";
import validate from "../middlewares/validate.middleware.js";
import {
  registerSchema,
  changePasswordSchema,
  updateProfileSchema,
} from "../validators/user.validator.js";

const router = Router();

// Public routes
router.post(
  "/",
  registerLimiter,
  validate(registerSchema),
  userController.create,
);

// Protected routes - MUST come before /:id to avoid "me" being treated as ObjectId
router.get("/me", protect, userController.getMyProfile);
router.put(
  "/me",
  protect,
  validate(updateProfileSchema),
  userController.updateProfile,
);
router.put(
  "/me/password",
  protect,
  validate(changePasswordSchema),
  userController.updatePassword,
);

// General routes
router.get("/",  userController.getAllUsers);
router.get("/:id", userController.getUserById);

export default router;