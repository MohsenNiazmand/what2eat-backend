import { ValidationError } from '../../domain/errors/AppError.js';

const IRANIAN_MOBILE_REGEX = /^09\d{9}$/;
const DEV_OTP = '123456';

export class AuthService {
  constructor(otpRepository) {
    this.otpRepository = otpRepository;
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

  _generateOtp() {
    return String(Math.floor(100000 + Math.random() * 900000));
  }
}
