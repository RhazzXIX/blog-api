import Post from "../models/post";
import Comment from "../models/comment";
import asyncHandler from "express-async-handler";
import {
  FieldValidationError,
  body,
  validationResult,
} from "express-validator";
import mongoose from "mongoose";
import verifyUserAuthority from "../assists/middlewares/verifyUserAuthority";
import { Handler } from "express";

const postController = {
  // Middleware for getting all blog posts.
  blogPosts: asyncHandler(async function (req, res, next) {
    // Fetch posts
    let posts: IPost[];

    // Fetch all post if the user is an Author.
    if (req.user && req.user.isAuthor) {
      posts = await Post.find()
        .populate({ path: "author", select: "name" })
        .lean()
        .exec();

      // Fetch only published posts.
    } else {
      posts = await Post.find({ isPublished: true })
        .populate({ path: "author", select: "name" })
        .sort({ publishedData: -1 })
        .lean()
        .exec();
    }

    // Send posts data.
    if (posts.length > 0) {
      res.status(200).json(posts);

      // Send info that there are no post yet.
    } else {
      res.status(404).json({ message: "There are no posts yet." });
    }
  }),

  // Middleware for getting a single post.
  blogPost: [
    verifyUserAuthority,
    asyncHandler(async function (req, res, next) {
      const post = res.locals.post;
      // Send post.
      res.status(200).json(post);
    }),
  ],

  // Middleware for creating a blog post.
  createBlogPost: [
    function (req, res, next) {
      // Check if the user is an author.
      if (req.user && req.user.isAuthor) return next();

      // Throw Unauthorized if not.
      res.status(401).send("Unauthorized for access.");
    } as Handler,
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
    // Handle Create blog post req.
    asyncHandler(async function (req, res, next) {
      // Get validation errors
      const errors = validationResult(req);
      // Container for content
      const content: IPostContent[] = [];

      // Loop at the req.body
      for (let i = 1; i <= 4; i++) {
        // Check if there are entries
        if (req.body[`title${i}`]) {
          // Push entries to content for saving to database.
          content.push({
            headerImg: req.body[`headerImg${i}`] || undefined,
            title: req.body[`title${i}`],
            text: req.body[`body${i}`],
          } as IPostContent);
        }
      }

      // Create Blog post.
      const blogPost = new Post({
        content,
        author: req.user?._id,
        isPublished: false,
        totalComments: 0,
      });

      // If there are no validation errors. Create blog post
      if (errors.isEmpty()) {
        // Save the post.
        blogPost
          .save()
          // If saving the document is successful.
          .then(async () => {
            // Populate Author.
            await blogPost.populate({
              path: "author",
              select: "name",
            });

            // Send response if success.
            res.status(201).json(blogPost);
          })
          // If there are errors.
          .catch(async () => {
            // Delete the said post for preventing bloating the database.
            await Post.findByIdAndDelete(blogPost._id);

            // Send error if there are problems with the saving to database
            res.status(500).json({ message: "Internal server error" });
          });
      } else {
        res.status(400).json({
          errors: errors.array().map((error) => {
            console.log(error);
            const {
              value: entry,
              msg: message,
              path: field,
            } = error as FieldValidationError;
            return { message, entry, field };
          }),
        });
      }
    }),
  ],

  // Middleware for getting comment list.
  blogPostComments: [
    verifyUserAuthority,
    asyncHandler(async function (req, res, next) {
      // Get post.
      const post = res.locals.post;

      // Fetch comments.
      const comments = await Comment.find({ blogPost: post._id })
        .populate({ path: "commenter", select: "name" })
        .lean()
        .exec();

      // Send comment list.
      if (comments.length > 0) {
        res.status(200).json(comments);

        // Send info if there are not comments yet.
      } else {
        res.status(404).json({ message: "There are no comments yet." });
      }
    }),
  ],
};

export default postController;
