import Post from "../models/post";
import Comment from "../models/comment";
import asyncHandler from "express-async-handler";
import { body, validationResult, ValidationError } from "express-validator";
import { Handler } from "express";
import mongoose from "mongoose";
import createHttpError from "http-errors";

const postController = {
  // Middleware for getting all blog posts.
  blogPosts: asyncHandler(async function (req, res, next) {
    // Fetch all posts
    const posts = await Post.find()
      .populate({ path: "author", select: "name" })
      .lean()
      .exec();
    if (posts.length > 0) {
      // Send posts data.
      res.status(200).json(posts);
    } else {
      res.status(204).json({ message: "There are no posts yet" });
    }
  }),

  // Middleware for getting a single post.
  blogPost: asyncHandler(async function (req, res, next) {
    // Blog Post that user requests.
    const { postId } = req.params;

    // Check if a valid request.
    if (mongoose.isValidObjectId(postId)) {
      // Fetched blog post data
      const post = await Post.findById(postId)
        .populate({ path: "author", select: "name" })
        .lean()
        .exec();

      // Send data if post is found.
      if (post) {
        res.status(200).json(post);
      } else {
        // Else send not found error.
        next(createHttpError(400, "Post not found"));
      }
    } else {
      // Send error if invalid request.
      next(createHttpError(400, "Post not found"));
    }
  }),
};

export default postController;
