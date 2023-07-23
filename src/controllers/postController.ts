import Post from "../models/post";
import Comment from "../models/comment";
import asyncHandler from "express-async-handler";
import mongoose from "mongoose";
import verifyUnpublishedAccess from "../assists/middlewares/verifyUnpublishedAccess";
import verifyIfAuthor from "../assists/middlewares/verifyIfAuthor";
import validate from "../assists/middlewares/validate";
import checkValidation from "../assists/middlewares/checkValidation";

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
    verifyUnpublishedAccess,
    asyncHandler(async function (req, res, next) {
      const post = res.locals.post;
      // Send post.
      res.status(200).json(post);
    }),
  ],

  // Middleware for creating a blog post.
  createBlogPost: [
    verifyIfAuthor,
    // Validate and sanitize.
    ...validate.post,
    checkValidation,

    // Handle Create blog post req.
    asyncHandler(async function (req, res, next) {
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
        .catch(async (err) => {
          // Delete the said post for preventing bloating the database.
          await Post.findByIdAndDelete(blogPost._id);
          next(err);
        });
    }),
  ],

  // Delete a blog post
  deleteBlogPost: [
    verifyIfAuthor,
    asyncHandler(async function (req, res, next) {
      const { postId } = req.params;
      // Verify if correct id.
      if (mongoose.isValidObjectId(postId)) {
        // Fetch and delete blog post.
        const deletedPost = await Post.findByIdAndDelete(postId).exec();
        if (deletedPost) {
          // Send post if successfully deleted.
          res.status(200).json({
            message: `Deleted "${deletedPost.content[0].title}"`,
          });
        } else {
          // Send a not found error.
          res.status(404).json({ message: "Post not found." });
        }
      } else {
        // Send a not found error.
        res.status(404).json({ message: "Post not found." });
      }
    }),
  ],

  // Middleware for getting comment list.
  blogPostComments: [
    verifyUnpublishedAccess,
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
