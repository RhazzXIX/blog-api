import { validationResult, FieldValidationError } from "express-validator";
import { Handler } from "express";

const checkValidation = function (req, res, next) {
  // Get validation errors.
  const errors = validationResult(req);

  // If there are no errors, proceed to next middleware.
  if (errors.isEmpty()) {
    next();

    // Send the errors to client.
  } else {
    res.status(400).json({
      errors: errors.array().map((error) => {
        // Extract suitable data for sending.
        const {
          value: entry,
          msg: message,
          path: field,
        } = error as FieldValidationError;
        return { message, entry, field };
      }),
    });
  }
} as Handler;

export default checkValidation;
