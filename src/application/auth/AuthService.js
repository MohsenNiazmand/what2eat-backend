import {
  ValidationError,
  UnauthorizedError,
} from '../../domain/errors/AppError.js';

const IRANIAN_MOBILE_REGEX = /^09\d{9}$/;
const DEV_OTP = '123456';

export class AuthService {
  constructor(otpRepository, userRepository, sessionRepository, tokenService) {
    this.otpRepository = otpRepository;
    this.userRepository = userRepository;
    this.sessionRepository = sessionRepository;
    this.tokenService = tokenService;
  }

  async requestOtp(mobileNumber, deviceId) {
    if (!deviceId) {
      throw new ValidationError('deviceId is required');
    }

    if (!IRANIAN_MOBILE_REGEX.test(mobileNumber)) {
      throw new ValidationError('Invalid Iranian mobile number format');
    }

    const otp = process.env.NODE_ENV === 'production' ? this._generateOtp() : DEV_OTP;

    await this.otpRepository.save(mobileNumber, otp, deviceId);

    return { success: true, message: 'OTP sent successfully' };
  }

  async verifyOtp(mobileNumber, otpCode, deviceId) {
    if (!deviceId) {
      throw new ValidationError('deviceId is required');
    }

    if (!otpCode) {
      throw new ValidationError('otpCode is required');
    }

    if (!IRANIAN_MOBILE_REGEX.test(mobileNumber)) {
      throw new ValidationError('Invalid Iranian mobile number format');
    }

    const storedOtp = await this.otpRepository.get(mobileNumber);

    if (!storedOtp || storedOtp.otp !== otpCode) {
      throw new UnauthorizedError('Invalid or expired OTP');
    }

    if (storedOtp.deviceId !== deviceId) {
      throw new ValidationError('deviceId does not match the OTP request');
    }

    await this.otpRepository.delete(mobileNumber);

    let user = await this.userRepository.findByMobile(mobileNumber);
    if (!user) {
      user = await this.userRepository.create(mobileNumber);
    }

    await this.sessionRepository.deleteByUserId(user.id);

    const accessToken = this.tokenService.generateAccessToken(user.id, deviceId);
    const refreshToken = this.tokenService.generateRefreshToken(user.id, deviceId);
    const expiresAt = this.tokenService.getRefreshTokenExpiry();

    await this.sessionRepository.create({
      userId: user.id,
      refreshToken,
      deviceId,
      expiresAt,
    });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        mobileNumber: user.mobile,
      },
    };
  }

  _generateOtp() {
    return String(Math.floor(100000 + Math.random() * 900000));
  }
}
