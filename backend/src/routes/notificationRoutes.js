import express from "express";

import {
  getNotifications,
  markAsRead,
  markAllAsRead,
} from "../controllers/notificationController.js";

import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(authMiddleware);

router.get("/", getNotifications);
router.patch("/read-all", markAllAsRead);
router.patch("/:notification_id/read", markAsRead);

export default router;