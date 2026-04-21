import { Router } from "express";
import {
  createMessage,
  getInbox,
  getSent,
  getMessageById,
  markAsRead,
  deleteMessage,
  getUnreadCount,
  getAllMessages,
} from "../controllers/message.controller.js";
import protect from "../middlewares/auth.middleware.js";
import adminOnly from "../middlewares/adminOnly.middleware.js";
import validate from "../middlewares/validate.middleware.js";
import { createMessageSchema } from "../validators/message.validator.js";

const router = Router();

router.use(protect);

router.get("/inbox", getInbox);
router.get("/sent", getSent);
router.get("/unread-count", getUnreadCount);
router.get("/admin/all", adminOnly, getAllMessages);
router.get("/:id", getMessageById);

router.post("/", validate(createMessageSchema), createMessage);
router.patch("/:id/read", markAsRead);
router.delete("/:id", deleteMessage);

export default router;