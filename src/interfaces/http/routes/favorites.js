import express from 'express';
import { addFavorite, listFavorites, removeFavorite } from '../controllers/favoriteController.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.get('/', authMiddleware, listFavorites);
router.post('/', authMiddleware, addFavorite);
router.delete('/:recipeId', authMiddleware, removeFavorite);

export default router;
