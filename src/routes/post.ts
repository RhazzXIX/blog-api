import express from "express";
import postController from "../controllers/postController";
const router = express.Router();

/* GET all posts */
router.get("/", postController.blogPosts);

// GET a single post
router.get('/:postId', postController.blogPost)

export default router;
