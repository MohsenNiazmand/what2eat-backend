import request from 'supertest';
import app from '../../../src/interfaces/http/app.js';
import prisma from '../../../src/infrastructure/database/prisma.js';
import redisClient from '../../../src/infrastructure/redis/client.js';

const OTP_KEY_PREFIX = 'otp:';
const TEST_MOBILE = '09121234567';
const TEST_DEVICE_ID = '550e8400-e29b-41d4-a716-446655440000';

describe('Auth middleware and session management', () => {
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
    await prisma.session.deleteMany({ where: { user: { mobile: TEST_MOBILE } } });
    await prisma.user.deleteMany({ where: { mobile: TEST_MOBILE } });
    await redisClient.del(`${OTP_KEY_PREFIX}${TEST_MOBILE}`);
    await redisClient.del(`${OTP_KEY_PREFIX}${TEST_MOBILE}:device`);
  });

  it('should reject requests without a valid access token', async () => {
    const response = await request(app).get('/api/auth/me');

    expect(response.status).toBe(401);
    expect(response.body).toEqual({
      success: false,
      message: 'Authentication token is required',
    });
  });

  it('should allow access when a valid session token is provided', async () => {
    await request(app)
      .post('/api/auth/otp/request')
      .send({ mobileNumber: TEST_MOBILE, deviceId: TEST_DEVICE_ID });

    const verifyResponse = await request(app)
      .post('/api/auth/otp/verify')
      .send({
        mobileNumber: TEST_MOBILE,
        otpCode: '123456',
        deviceId: TEST_DEVICE_ID,
      });

    const response = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${verifyResponse.body.accessToken}`);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      success: true,
      data: {
        id: expect.any(String),
        mobileNumber: TEST_MOBILE,
      },
    });
  });
});
