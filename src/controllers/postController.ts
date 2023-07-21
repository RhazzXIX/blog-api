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
    // Check if the user the author.
    if (req.user && req.user.isAuthor) {
      // Fetch all posts.
      posts = await Post.find()
        .populate({ path: "author", select: "name" })
        .lean()
        .exec();
    } else {
      // Fetch only published posts.
      posts = await Post.find({ isPublished: true })
        .populate({ path: "author", select: "name" })
        .sort({ publishedData: -1 })
        .lean()
        .exec();
    }
    if (posts.length > 0) {
      // Send posts data.
      res.status(200).json(posts);
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
};

export default postController;
