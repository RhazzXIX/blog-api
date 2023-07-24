import express from "express";
import userController from "../controllers/userController";

const router = express.Router();

// Get current session
router.get("/", userController.userInfo);

// Create a new session.
router.post("/", userController.userLogin);

// Delete a session.
router.delete("/", userController.userLogOut);

export default router;
