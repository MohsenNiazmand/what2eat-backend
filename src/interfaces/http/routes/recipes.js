import express from 'express';
import { generateRecipe } from '../controllers/recipeController.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.post('/generate', authMiddleware, generateRecipe);

export default router;
