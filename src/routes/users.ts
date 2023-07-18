import express from "express";
import userController from "../controllers/userController";
const router = express.Router();

// API for user sign-up.
router.post("/sign-up", userController.userSignUp);

// API for user log in.
router.post("/log-in", userController.userLogin);

export default router;
