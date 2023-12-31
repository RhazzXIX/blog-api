import express from "express";
import userController from "../controllers/userController";
const router = express.Router();

// API for user sign-up.
router.post("/", userController.userSignUp);

// API for user info
router.get("/:userId", userController.userInfo);

// API for delete user.
router.delete('/:userId', userController.deleteUser)

export default router;
