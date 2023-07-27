import { body } from "express-validator";

const validate = {
  post: [
    // Validate and sanitize.
    body("headerImg1").escape(),
    body("title1", "Title should have at least 3 characters.")
      .trim()
      .isLength({ min: 3 })
      .escape(),
    body("body1", "Body should have at least 10 characters.")
      .trim()
      .isLength({ min: 10 })
      .escape(),
    body("headerImg2").optional().escape(),
    body("title2", "Sub header should have at least 3 characters.")
      .optional()
      .trim()
      .isLength({ min: 3 })
      .escape(),
    body("body2", "Body should have at least 10 characters.")
      .if(body("title2").notEmpty())
      .trim()
      .isLength({ min: 10 })
      .escape(),
    body("headerImg3").optional().escape(),
    body("title3", "Second sub header should have at least 3 characters.")
      .optional()
      .trim()
      .isLength({ min: 3 })
      .escape(),
    body("body3", "Body should have at least 10 characters.")
      .if(body("title3").notEmpty())
      .trim()
      .isLength({ min: 10 })
      .escape(),
    body("headerImg4").optional().escape(),
    body("title4", "Third sub header should have at least 3 characters.")
      .optional()
      .trim()
      .isLength({ min: 3 })
      .escape(),
    body("body4", "Body should have at least 10 characters.")
      .if(body("title4").notEmpty())
      .trim()
      .isLength({ min: 10 })
      .escape(),
  ],
  publish: [
    body("publish", 'Publish should have a "yes" or "no" value.')
      .escape()
      .custom((value) => {
        if (value === "yes" || value === "no") {
          return true;
        } else {
          return false;
        }
      }),
  ],
  comment: [
    body("comment", "Comment should not be empty.").notEmpty().escape(),
  ],
};

export default validate;
