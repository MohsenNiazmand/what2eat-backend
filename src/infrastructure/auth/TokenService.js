import jwt from 'jsonwebtoken';
import { randomUUID } from 'crypto';

const ACCESS_TOKEN_EXPIRES_IN = '15m';
const REFRESH_TOKEN_EXPIRES_IN = '7d';
const REFRESH_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export class TokenService {
  generateAccessToken(userId, deviceId) {
    return jwt.sign({ userId, deviceId, jti: randomUUID() }, this._getSecret(), {
      expiresIn: ACCESS_TOKEN_EXPIRES_IN,
    });
  }

  generateRefreshToken(userId, deviceId) {
    return jwt.sign({ userId, deviceId, jti: randomUUID() }, this._getSecret(), {
      expiresIn: REFRESH_TOKEN_EXPIRES_IN,
    });
  }

  verifyAccessToken(token) {
    return jwt.verify(token, this._getSecret());
  }

  verifyRefreshToken(token) {
    return jwt.verify(token, this._getSecret());
  }

  getRefreshTokenExpiry() {
    return new Date(Date.now() + REFRESH_TOKEN_TTL_MS);
  }

  _getSecret() {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error('JWT_SECRET is not configured');
    }
    return secret;
  }
}
