import { body } from "express-validator";

export const createReportValidator = [
  body("reported_id")
    .notEmpty()
    .withMessage("Reported user ID is required")
    .isUUID()
    .withMessage("Invalid reported user ID"),

  body("reason")
    .notEmpty()
    .withMessage("Reason is required")
    .isIn([
      "spam",
      "fake_food",
      "no_show",
      "inappropriate_content",
      "other",
    ])
    .withMessage("Invalid reason"),

  body("description")
    .optional()
    .isLength({ max: 1000 })
    .withMessage("Description max 1000 characters"),
];