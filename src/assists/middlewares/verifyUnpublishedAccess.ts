import { Handler } from "express";
import Post from "../../models/post";
import asyncHandler from "express-async-handler";
import mongoose from "mongoose";

const verifyUnpublishedAccess = asyncHandler(async function (req, res, next) {
  // Get post id.
  const { postId } = req.params;
  // check if valid req.
  if (mongoose.isValidObjectId(postId) === false)
    return res.status(404).json({ message: "Post not found" });
  // Fetch post.
  const post = await Post.findById(postId).exec();
  // Check if post is found.
  if (post) {
    // Check if post is published
    if (post.isPublished) {
      // Send post to next middleware.
      res.locals.post = await post.populate({
        path: "author",
        select: "name",
        options: { lean: true },
      });
      // Proceed to next middleware.
      next();
    } else {
      // If the post is unpublished, check user if he is an Author.
      if (req.user && req.user.isAuthor) {
        // Send post to next middleware.
        res.locals.post = await post.populate({
          path: "author",
          select: "name",
          options: { lean: true },
        });
        // Proceed to next middleware.
        next();
      } else {
        // Send unauthorized error.
        res.status(401).json({ message: "Unauthorized request" });
      }
    }
  } else {
    res.status(404).json({ message: "Post not found" });
  }
} as Handler);

export default verifyUnpublishedAccess;
