import asyncHandler from "express-async-handler";
import User from "../models/user";
import { ValidationError, body, validationResult } from "express-validator";
import bcrypt from "bcryptjs";
import passport, { AuthenticateCallback } from "passport";
import { Handler } from "express";

const userController = {
  // Middleware for user sign-up.
  userSignUp: [
    // Validate and sanitize user input.
    body("username", "Username should have at least 3 characters.")
      .trim()
      .isLength({ min: 3 })
      .escape(),
    body("password", "Password should have at least 5 characters.")
      .trim()
      .isLength({ min: 5 })
      .escape(),
    body(
      "passwordConfirmation",
      "Password and confirm password does not match."
    ).custom((value, { req }) => {
      return value === req.body.password;
    }),

    // Handle Sign-up Post req.
    asyncHandler(async (req, res, next) => {
      const { username, password } = req.body;

      // Errors container.
      const errors: ValidationError | { msg: string }[] = [];

      // Errors from validation.
      const validationErrors = validationResult(req);

      // Add validation errors to container.
      if (!validationErrors.isEmpty())
        validationErrors.array().forEach((err) => errors.push(err));
      // If user already used, add to error container.
      const userExists = await User.findOne({ name: username }).exec();
      if (userExists) errors.push({ msg: "User already exists." });
      if (errors.length > 0) {
        // Send validation errors
        res.status(400).json(errors);
      } else {
        bcrypt.hash(password, 10, async function (err, hashedPassword) {
          // throw error from hashing.
          if (err) return next(err);

          // Create user and save to database.
          const user = new User({
            name: username,
            password: hashedPassword,
            isAuthor: false,
            email: "email@example.com",
          });
          await user.save();

          // Send successful sign-up status.
          res.status(201).json({
            message: "User created.",
            id: user._id,
            username: user.name,
            isAuthor: user.isAuthor,
          });
        });
      }
    }),
  ],
  // Middleware for user log in.
  userLogin: [
    // Validate and sanitize user input
    body("username", "Username should have at least 3 characters.")
      .trim()
      .isLength({ min: 3 })
      .escape(),
    body("password", "Password should have at least 5 characters.")
      .trim()
      .isLength({ min: 5 })
      .escape(),
    asyncHandler(async function (req, res, next) {
      const errors: { error: { msg: string } }[] = [];

      // Check for validation errors.
      const validationErrors = validationResult(req);

      // Authenticate user if there are no validation errors.
      if (validationErrors.isEmpty()) {
        await passport.authenticate("local", {}, function (err, user, info) {
          if (err) return next(err);
          if (info) return res.json(info);
          if (user) {
            req.login(user, function (err) {
              if (err) return next(err);
              next();
            });
          }
        } as AuthenticateCallback)(req, res, next);
      } else {
        // Send errors.
        validationErrors.array().forEach((err) => {
          const { msg } = err;
          errors.push({ error: { msg } });
        });
        res.status(400).json(errors);
      }
    }),
    function (req, res, next) {
      if (req.user)
        res.status(200).json({
          message: `User ${req.user.name} Logged in`,
          userInfo: {
            id: req.user._id,
            name: req.user.name,
            isAuthor: req.user.isAuthor,
          },
        });
    } as Handler,
  ],
  // Middleware for fetching user info.
  userInfo: asyncHandler(async function (req, res, next) {
    console.log(req.user);
    // Check if logged in user and if user id and parameters match.
    if (req.user && req.user._id.toString() === req.params.userId.toString()) {
      // Fetch data from database.
      const user = await User.findById(req.params.userId)
        .select("name isAuthor")
        .exec();
      // Send Data
      res.status(200).json(user);
    } else {
      // Send error if user is not logged in and the Id does not match.
      res.status(401).send("Unauthorized Request");
    }
  }),
};

export default userController;
