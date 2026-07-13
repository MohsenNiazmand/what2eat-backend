import { OtpRepository } from '../../../infrastructure/redis/OtpRepository.js';
import { UserRepository } from '../../../infrastructure/database/UserRepository.js';
import { SessionRepository } from '../../../infrastructure/database/SessionRepository.js';
import { TokenService } from '../../../infrastructure/auth/TokenService.js';
import { AuthService } from '../../../application/auth/AuthService.js';

const authService = new AuthService(
  new OtpRepository(),
  new UserRepository(),
  new SessionRepository(),
  new TokenService()
);

export async function requestOtp(req, res, next) {
  try {
    const { mobileNumber, deviceId } = req.body;
    const result = await authService.requestOtp(mobileNumber, deviceId);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

export async function verifyOtp(req, res, next) {
  try {
    const { mobileNumber, otpCode, deviceId } = req.body;
    const result = await authService.verifyOtp(mobileNumber, otpCode, deviceId);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

export async function me(req, res, next) {
  try {
    res.status(200).json({
      success: true,
      data: {
        id: req.user.id,
        mobileNumber: req.user.mobileNumber,
      },
    });
  } catch (error) {
    next(error);
  }
}
