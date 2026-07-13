import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../../../src/interfaces/http/app.js';
import redisClient from '../../../src/infrastructure/redis/client.js';
import prisma from '../../../src/infrastructure/database/prisma.js';

const OTP_KEY_PREFIX = 'otp:';
const TEST_MOBILE = '09129876543';
const OTHER_MOBILE = '09131112233';
const TEST_DEVICE_ID = '550e8400-e29b-41d4-a716-446655440000';
const OTHER_DEVICE_ID = '660e8400-e29b-41d4-a716-446655440001';
const TEST_OTP = '123456';
const JWT_SECRET = process.env.JWT_SECRET;

async function requestOtp(mobileNumber, deviceId) {
  return request(app)
    .post('/api/auth/otp/request')
    .send({ mobileNumber, deviceId });
}

async function cleanupUser(mobileNumber) {
  const user = await prisma.user.findUnique({ where: { mobile: mobileNumber } });
  if (user) {
    await prisma.session.deleteMany({ where: { userId: user.id } });
    await prisma.user.delete({ where: { id: user.id } });
  }
  await redisClient.del(`${OTP_KEY_PREFIX}${mobileNumber}`);
  await redisClient.del(`${OTP_KEY_PREFIX}${mobileNumber}:device`);
}

describe('POST /api/auth/otp/verify', () => {
  beforeAll(async () => {
    if (!redisClient.isOpen) {
      await redisClient.connect();
    }
  });

  afterAll(async () => {
    await cleanupUser(TEST_MOBILE);
    await cleanupUser(OTHER_MOBILE);
    await prisma.$disconnect();
    if (redisClient.isOpen) {
      await redisClient.quit();
    }
  });

  beforeEach(async () => {
    await cleanupUser(TEST_MOBILE);
    await cleanupUser(OTHER_MOBILE);
  });

  it('should return tokens and user for valid OTP verification', async () => {
    await requestOtp(TEST_MOBILE, TEST_DEVICE_ID);

    const response = await request(app)
      .post('/api/auth/otp/verify')
      .send({
        mobileNumber: TEST_MOBILE,
        otpCode: TEST_OTP,
        deviceId: TEST_DEVICE_ID,
      });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('accessToken');
    expect(response.body).toHaveProperty('refreshToken');
    expect(response.body.user).toEqual({
      id: expect.any(String),
      mobileNumber: TEST_MOBILE,
    });

    const decoded = jwt.verify(response.body.accessToken, JWT_SECRET);
    expect(decoded).toMatchObject({
      userId: response.body.user.id,
      deviceId: TEST_DEVICE_ID,
    });
  });

  it('should create a new user when mobile number is not registered', async () => {
    await requestOtp(TEST_MOBILE, TEST_DEVICE_ID);

    const response = await request(app)
      .post('/api/auth/otp/verify')
      .send({
        mobileNumber: TEST_MOBILE,
        otpCode: TEST_OTP,
        deviceId: TEST_DEVICE_ID,
      });

    expect(response.status).toBe(200);

    const user = await prisma.user.findUnique({ where: { mobile: TEST_MOBILE } });
    expect(user).not.toBeNull();
    expect(user.id).toBe(response.body.user.id);
  });

  it('should reuse existing user on subsequent verification', async () => {
    await requestOtp(TEST_MOBILE, TEST_DEVICE_ID);

    const first = await request(app)
      .post('/api/auth/otp/verify')
      .send({
        mobileNumber: TEST_MOBILE,
        otpCode: TEST_OTP,
        deviceId: TEST_DEVICE_ID,
      });

    await requestOtp(TEST_MOBILE, TEST_DEVICE_ID);

    const second = await request(app)
      .post('/api/auth/otp/verify')
      .send({
        mobileNumber: TEST_MOBILE,
        otpCode: TEST_OTP,
        deviceId: TEST_DEVICE_ID,
      });

    expect(first.body.user.id).toBe(second.body.user.id);
  });

  it('should return 401 when OTP is invalid', async () => {
    await requestOtp(TEST_MOBILE, TEST_DEVICE_ID);

    const response = await request(app)
      .post('/api/auth/otp/verify')
      .send({
        mobileNumber: TEST_MOBILE,
        otpCode: '000000',
        deviceId: TEST_DEVICE_ID,
      });

    expect(response.status).toBe(401);
    expect(response.body).toEqual({
      success: false,
      message: 'Invalid or expired OTP',
    });
  });

  it('should return 401 when OTP is not found in Redis', async () => {
    const response = await request(app)
      .post('/api/auth/otp/verify')
      .send({
        mobileNumber: TEST_MOBILE,
        otpCode: TEST_OTP,
        deviceId: TEST_DEVICE_ID,
      });

    expect(response.status).toBe(401);
    expect(response.body).toEqual({
      success: false,
      message: 'Invalid or expired OTP',
    });
  });

  it('should return 400 when deviceId does not match stored value', async () => {
    await requestOtp(TEST_MOBILE, TEST_DEVICE_ID);

    const response = await request(app)
      .post('/api/auth/otp/verify')
      .send({
        mobileNumber: TEST_MOBILE,
        otpCode: TEST_OTP,
        deviceId: OTHER_DEVICE_ID,
      });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('success', false);
    expect(response.body).toHaveProperty('message');
  });

  it('should enforce single session by revoking previous sessions', async () => {
    await requestOtp(TEST_MOBILE, TEST_DEVICE_ID);

    await request(app)
      .post('/api/auth/otp/verify')
      .send({
        mobileNumber: TEST_MOBILE,
        otpCode: TEST_OTP,
        deviceId: TEST_DEVICE_ID,
      });

    const user = await prisma.user.findUnique({ where: { mobile: TEST_MOBILE } });
    const oldSession = await prisma.session.create({
      data: {
        userId: user.id,
        token: 'old-refresh-token',
        deviceId: OTHER_DEVICE_ID,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    await requestOtp(TEST_MOBILE, TEST_DEVICE_ID);

    const response = await request(app)
      .post('/api/auth/otp/verify')
      .send({
        mobileNumber: TEST_MOBILE,
        otpCode: TEST_OTP,
        deviceId: TEST_DEVICE_ID,
      });

    expect(response.status).toBe(200);

    const sessions = await prisma.session.findMany({ where: { userId: user.id } });
    expect(sessions).toHaveLength(1);
    expect(sessions[0].token).not.toBe(oldSession.token);
    expect(sessions[0].deviceId).toBe(TEST_DEVICE_ID);
  });

  it('should persist session with refresh token and deviceId in database', async () => {
    await requestOtp(TEST_MOBILE, TEST_DEVICE_ID);

    const response = await request(app)
      .post('/api/auth/otp/verify')
      .send({
        mobileNumber: TEST_MOBILE,
        otpCode: TEST_OTP,
        deviceId: TEST_DEVICE_ID,
      });

    const user = await prisma.user.findUnique({ where: { mobile: TEST_MOBILE } });
    const session = await prisma.session.findFirst({ where: { userId: user.id } });

    expect(session).not.toBeNull();
    expect(session.token).toBe(response.body.refreshToken);
    expect(session.deviceId).toBe(TEST_DEVICE_ID);
    expect(session.expiresAt.getTime()).toBeGreaterThan(Date.now());
  });
});
