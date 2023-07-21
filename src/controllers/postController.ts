import Post from "../models/post";
import Comment from "../models/comment";
import asyncHandler from "express-async-handler";
import { body, validationResult, ValidationError } from "express-validator";
import { Handler } from "express";
import mongoose from "mongoose";
import verifyUserAuthority from "../assists/middlewares/verifyUserAuthority";

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
