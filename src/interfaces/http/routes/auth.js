import express from 'express';
import { logout, me, refresh, requestOtp, updateProfile, verifyOtp } from '../controllers/authController.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.post('/otp/request', requestOtp);
router.post('/otp/verify', verifyOtp);
router.post('/refresh', refresh);
router.post('/logout', authMiddleware, logout);
router.get('/me', authMiddleware, me);
router.patch('/me', authMiddleware, updateProfile);

export default router;
