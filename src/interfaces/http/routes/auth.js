import express from 'express';
import { requestOtp, verifyOtp } from '../controllers/authController.js';

const router = express.Router();

router.post('/otp/request', requestOtp);
router.post('/otp/verify', verifyOtp);

export default router;
