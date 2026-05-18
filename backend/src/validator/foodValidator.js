import { body, query } from "express-validator";

export const createFoodValidator = [
  body("name")
    .notEmpty()
    .withMessage("Food name is required")
    .isLength({ max: 100 })
    .withMessage("Food name max 100 characters"),

  body("description")
    .optional()
    .isLength({ max: 500 })
    .withMessage("Description max 500 characters"),

  body("quantity")
    .notEmpty()
    .withMessage("Quantity is required")
    .isInt({ min: 1 })
    .withMessage("Quantity must be a positive integer"),

  body("portion_unit")
    .optional()
    .isLength({ max: 50 })
    .withMessage("Portion unit max 50 characters"),

  body("pickup_location")
    .notEmpty()
    .withMessage("Pickup location is required")
    .isLength({ max: 255 })
    .withMessage("Pickup location max 255 characters"),

  body("pickup_lat")
    .optional()
    .isFloat({ min: -90, max: 90 })
    .withMessage("Invalid latitude"),

  body("pickup_lng")
    .optional()
    .isFloat({ min: -180, max: 180 })
    .withMessage("Invalid longitude"),

  body("expiry_date")
    .notEmpty()
    .withMessage("Expiry date is required")
    .isISO8601()
    .withMessage("Expiry date must be a valid ISO 8601 date")
    .custom((value) => {
      if (new Date(value) <= new Date()) {
        throw new Error("Expiry date must be in the future");
      }
      return true;
    }),
];

export const updateFoodValidator = [
  body("name")
    .optional()
    .isLength({ max: 100 })
    .withMessage("Food name max 100 characters"),

  body("description")
    .optional()
    .isLength({ max: 500 })
    .withMessage("Description max 500 characters"),

  body("quantity")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Quantity must be a positive integer"),

  body("pickup_location")
    .optional()
    .isLength({ max: 255 })
    .withMessage("Pickup location max 255 characters"),

  body("pickup_lat")
    .optional()
    .isFloat({ min: -90, max: 90 })
    .withMessage("Invalid latitude"),

  body("pickup_lng")
    .optional()
    .isFloat({ min: -180, max: 180 })
    .withMessage("Invalid longitude"),

  body("expiry_date")
    .optional()
    .isISO8601()
    .withMessage("Expiry date must be a valid ISO 8601 date")
    .custom((value) => {
      if (new Date(value) <= new Date()) {
        throw new Error("Expiry date must be in the future");
      }
      return true;
    }),
];

export const feedQueryValidator = [
  query("lat")
    .optional()
    .isFloat({ min: -90, max: 90 })
    .withMessage("Invalid latitude"),

  query("lng")
    .optional()
    .isFloat({ min: -180, max: 180 })
    .withMessage("Invalid longitude"),

  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Page must be a positive integer"),

  query("limit")
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage("Limit must be between 1 and 50"),
];