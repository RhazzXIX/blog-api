import Post from "../models/post";
import Comment from "../models/comment";
import asyncHandler from "express-async-handler";
import { body, validationResult, ValidationError } from "express-validator";
import { Handler } from "express";

const postController = {
  blogPosts: asyncHandler(async function (req, res, next) {
    const posts = await Post.find()
      .populate({ path: "author", select: "name" })
      .lean()
      .exec();
    res.status(200).json(posts);
  }),
};

export default postController;
