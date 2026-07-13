import express from 'express';
import { me, requestOtp, verifyOtp } from '../controllers/authController.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.post('/otp/request', requestOtp);
router.post('/otp/verify', verifyOtp);
router.get('/me', authMiddleware, me);

export default router;
