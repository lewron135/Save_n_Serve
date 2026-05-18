import express from "express";

import {
  signUp,
  signIn,
  logout,
  getProfile,
} from "../controllers/authController.js";

import {
  registerValidator,
  loginValidator,
} from "../validator/authValidator.js";

import validationMiddleware from "../middleware/validationMiddleware.js";

import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

router.post(
  "/signup",
  registerValidator,
  validationMiddleware,
  signUp
);

router.post(
  "/signin",
  loginValidator,
  validationMiddleware,
  signIn
);

router.post(
  "/logout",
  authMiddleware,
  logout
);

router.get(
  "/profile",
  authMiddleware,
  getProfile
);

export default router;