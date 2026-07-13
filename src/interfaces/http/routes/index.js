import express from 'express';
import healthRoutes from './health.js';
import authRoutes from './auth.js';
import recipeRoutes from './recipes.js';
import preferenceRoutes from './preferences.js';
import favoriteRoutes from './favorites.js';

const router = express.Router();

router.use('/health', healthRoutes);
router.use('/api/auth', authRoutes);
router.use('/api/recipes', recipeRoutes);
router.use('/api/preferences', preferenceRoutes);
router.use('/api/favorites', favoriteRoutes);

export default router;
