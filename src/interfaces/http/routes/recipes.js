import express from 'express';
import { generateRecipe, getRecipe, listRecipes } from '../controllers/recipeController.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.get('/', authMiddleware, listRecipes);
router.get('/:id', authMiddleware, getRecipe);
router.post('/generate', authMiddleware, generateRecipe);

export default router;
