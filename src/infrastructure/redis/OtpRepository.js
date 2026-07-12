import redisClient from './client.js';

const OTP_KEY_PREFIX = 'otp:';
const OTP_TTL_SECONDS = 300;

export class OtpRepository {
  async save(mobileNumber, otp, deviceId) {
    const otpKey = `${OTP_KEY_PREFIX}${mobileNumber}`;
    const deviceKey = `${OTP_KEY_PREFIX}${mobileNumber}:device`;

    await redisClient.set(otpKey, otp, { EX: OTP_TTL_SECONDS });
    await redisClient.set(deviceKey, deviceId, { EX: OTP_TTL_SECONDS });
  }
}
