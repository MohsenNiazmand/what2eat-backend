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

  async get(mobileNumber) {
    const otpKey = `${OTP_KEY_PREFIX}${mobileNumber}`;
    const deviceKey = `${OTP_KEY_PREFIX}${mobileNumber}:device`;

    const [otp, deviceId] = await Promise.all([
      redisClient.get(otpKey),
      redisClient.get(deviceKey),
    ]);

    if (!otp) {
      return null;
    }

    return { otp, deviceId };
  }

  async delete(mobileNumber) {
    await redisClient.del(
      `${OTP_KEY_PREFIX}${mobileNumber}`,
      `${OTP_KEY_PREFIX}${mobileNumber}:device`
    );
  }
}
