import express from 'express';
import { deletePreference, getPreference, upsertPreference } from '../controllers/preferenceController.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.get('/', authMiddleware, getPreference);
router.put('/', authMiddleware, upsertPreference);
router.delete('/', authMiddleware, deletePreference);

export default router;
