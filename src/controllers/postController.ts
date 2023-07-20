import Post from "../models/post";
import Comment from "../models/comment";
import asyncHandler from "express-async-handler";
import { body, validationResult, ValidationError } from "express-validator";
import { Handler } from "express";
import mongoose from "mongoose";

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

      // Fetch the post
      const post = await Post.findById(postId)
        .populate({ path: "author", select: "name" })
        .lean()
        .exec();

      // Check if the was post valid and published.
      if (post && post.isPublished) {
        // Send data if the post is published.
        res.status(200).json(post);

        // If post is not published, check if the user is the author.
      } else if (post && post.isPublished === false) {
        if (req.user && req.user.isAuthor) {
          // Send the unpublished post
          res.status(200).json(post);
        } else {
          // Send unauthorized if the user is not an author.
          res.status(401).json({ message: "Unauthorized" });
        }
      } else {
        // Else send not found error.
        res.status(400).json({ message: "Post not found" });
      }
    } else {
      // Send error if invalid request.
      res.status(400).json({ message: "Post not found" });
    }
  }),
};

export default postController;
