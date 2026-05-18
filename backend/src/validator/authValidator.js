import { body } from "express-validator";

export const registerValidator = [
  body("full_name")
    .notEmpty()
    .withMessage("Full name is required"),

  body("email")
    .isEmail()
    .withMessage("Invalid email"),

  body("password")
    .isLength({ min: 8 })
    .withMessage(
      "Password must be at least 8 characters"
    ),

  body("role")
    .isIn(["giver", "receiver"])
    .withMessage(
      "Role must be giver or receiver"
    ),
];

export const loginValidator = [
  body("email")
    .isEmail()
    .withMessage("Invalid email"),

  body("password")
    .notEmpty()
    .withMessage("Password is required"),
];