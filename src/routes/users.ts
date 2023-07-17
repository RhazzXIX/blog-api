import express from 'express'
import userController from '../controllers/userController';
const router = express.Router();

// Route for user sign-up.
router.post('/sign-up', userController.userSignUp);

export default router;
