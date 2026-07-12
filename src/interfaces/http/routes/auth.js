import express from 'express';
import { requestOtp } from '../controllers/authController.js';

const router = express.Router();

router.post('/otp/request', requestOtp);

export default router;
