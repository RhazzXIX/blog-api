import express from "express";
import postController from "../controllers/postController";
const router = express.Router();

/* GET all posts */
router.get("/", postController.blogPosts);

// POST a blog post
router.post("/", postController.createBlogPost);

// GET a single post
router.get("/:postId", postController.blogPost);

// DELETE a single post.
router.delete("/:postId", postController.deleteBlogPost);

// GET all comments from a blog post
router.get("/:postId/comments", postController.blogPostComments);

export default router;
