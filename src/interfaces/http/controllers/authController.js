import { OtpRepository } from '../../../infrastructure/redis/OtpRepository.js';
import { AuthService } from '../../../application/auth/AuthService.js';

const authService = new AuthService(new OtpRepository());

export async function requestOtp(req, res, next) {
  try {
    const { mobileNumber, deviceId } = req.body;
    const result = await authService.requestOtp(mobileNumber, deviceId);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}
