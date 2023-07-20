import express from "express";
import postController from "../controllers/postController";
const router = express.Router();

/* GET home page. */
router.get("/", postController.blogPosts);

export default router;
