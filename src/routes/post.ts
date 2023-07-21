import express from "express";
import postController from "../controllers/postController";
const router = express.Router();

/* GET all posts */
router.get("/", postController.blogPosts);

// GET a single post
router.get("/:postId", postController.blogPost);

// GET all comments from a blog post
router.get("/:postId/comments", postController.blogPostComments);

export default router;
