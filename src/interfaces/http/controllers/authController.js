import { OtpRepository } from '../../../infrastructure/redis/OtpRepository.js';
import { UserRepository } from '../../../infrastructure/database/UserRepository.js';
import { SessionRepository } from '../../../infrastructure/database/SessionRepository.js';
import { TokenService } from '../../../infrastructure/auth/TokenService.js';
import { AuthService } from '../../../application/auth/AuthService.js';
import { UpdateProfileUseCase } from '../../../application/user/UpdateProfileUseCase.js';
import { RecipeOptionsService } from '../../../application/recipe/RecipeOptionsService.js';

const authService = new AuthService(
  new OtpRepository(),
  new UserRepository(),
  new SessionRepository(),
  new TokenService()
);

const updateProfileUseCase = new UpdateProfileUseCase(new UserRepository());
const recipeOptionsService = new RecipeOptionsService();

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
        name: req.user.name,
        recipeOptions: recipeOptionsService.getOptionsForUser(req.user),
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function updateProfile(req, res, next) {
  try {
    const result = await updateProfileUseCase.execute(req.user.id, req.body);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

export async function refresh(req, res, next) {
  try {
    const { refreshToken, deviceId } = req.body;
    const result = await authService.refreshAccessToken(refreshToken, deviceId);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

export async function logout(req, res, next) {
  try {
    const result = await authService.logout(req.user.id, req.user.deviceId);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}
