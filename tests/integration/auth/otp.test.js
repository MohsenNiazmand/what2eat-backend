import request from 'supertest';
import app from '../../../src/interfaces/http/app.js';
import redisClient from '../../../src/infrastructure/redis/client.js';

const OTP_KEY_PREFIX = 'otp:';
const TEST_MOBILE = '09121234567';
const TEST_DEVICE_ID = '550e8400-e29b-41d4-a716-446655440000';

describe('POST /api/auth/otp/request', () => {
  beforeAll(async () => {
    if (!redisClient.isOpen) {
      await redisClient.connect();
    }
  });

  afterAll(async () => {
    if (redisClient.isOpen) {
      await redisClient.quit();
    }
  });

  beforeEach(async () => {
    await redisClient.del(`${OTP_KEY_PREFIX}${TEST_MOBILE}`);
    await redisClient.del(`${OTP_KEY_PREFIX}${TEST_MOBILE}:device`);
  });

  it('should return success when mobile number and deviceId are valid', async () => {
    const response = await request(app)
      .post('/api/auth/otp/request')
      .send({ mobileNumber: TEST_MOBILE, deviceId: TEST_DEVICE_ID });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      success: true,
      message: 'OTP sent successfully',
    });
  });

  it('should store OTP and deviceId in Redis with 5-minute expiration', async () => {
    await request(app)
      .post('/api/auth/otp/request')
      .send({ mobileNumber: TEST_MOBILE, deviceId: TEST_DEVICE_ID });

    const storedOtp = await redisClient.get(`${OTP_KEY_PREFIX}${TEST_MOBILE}`);
    const storedDeviceId = await redisClient.get(
      `${OTP_KEY_PREFIX}${TEST_MOBILE}:device`
    );
    const ttl = await redisClient.ttl(`${OTP_KEY_PREFIX}${TEST_MOBILE}`);

    expect(storedOtp).toBe('123456');
    expect(storedDeviceId).toBe(TEST_DEVICE_ID);
    expect(ttl).toBeGreaterThan(0);
    expect(ttl).toBeLessThanOrEqual(300);
  });

  it('should return 400 when mobile number format is invalid', async () => {
    const response = await request(app)
      .post('/api/auth/otp/request')
      .send({ mobileNumber: '12345', deviceId: TEST_DEVICE_ID });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('success', false);
    expect(response.body).toHaveProperty('message');
  });

  it('should return 400 when deviceId is missing', async () => {
    const response = await request(app)
      .post('/api/auth/otp/request')
      .send({ mobileNumber: TEST_MOBILE });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('success', false);
    expect(response.body).toHaveProperty('message');
  });
});
