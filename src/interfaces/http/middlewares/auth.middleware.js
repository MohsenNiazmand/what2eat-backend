import { UnauthorizedError } from '../../../domain/errors/AppError.js';
import { TokenService } from '../../../infrastructure/auth/TokenService.js';
import { SessionRepository } from '../../../infrastructure/database/SessionRepository.js';
import { UserRepository } from '../../../infrastructure/database/UserRepository.js';

const tokenService = new TokenService();
const sessionRepository = new SessionRepository();
const userRepository = new UserRepository();

export async function authMiddleware(req, res, next) {
  try {
    const authorizationHeader = req.headers.authorization;

    if (!authorizationHeader || !authorizationHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('Authentication token is required');
    }

    const token = authorizationHeader.slice(7).trim();
    if (!token) {
      throw new UnauthorizedError('Authentication token is required');
    }

    const payload = tokenService.verifyAccessToken(token);
    const session = await sessionRepository.findActiveSession(payload.userId, payload.deviceId);

    if (!session) {
      throw new UnauthorizedError('Invalid or expired session');
    }

    const user = await userRepository.findById(payload.userId);
    if (!user) {
      throw new UnauthorizedError('Invalid or expired session');
    }

    req.user = {
      id: user.id,
      deviceId: payload.deviceId,
      mobileNumber: user.mobile,
    };

    next();
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return next(error);
    }

    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return next(new UnauthorizedError('Invalid or expired token'));
    }

    next(error);
  }
}
