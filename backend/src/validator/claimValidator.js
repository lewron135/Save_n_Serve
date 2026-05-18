import { body } from "express-validator";

export const ratingValidator = [
  body("rating")
    .notEmpty()
    .withMessage("Rating is required")
    .isInt({ min: 1, max: 5 })
    .withMessage("Rating must be between 1 and 5"),

  body("comment")
    .optional()
    .isLength({ max: 500 })
    .withMessage("Comment max 500 characters"),
];