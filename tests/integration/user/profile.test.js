import request from 'supertest';
import app from '../../../src/interfaces/http/app.js';
import prisma from '../../../src/infrastructure/database/prisma.js';
import redisClient from '../../../src/infrastructure/redis/client.js';

const OTP_KEY_PREFIX = 'otp:';
const TEST_MOBILE = '09125678901';
const TEST_DEVICE_ID = '990e8400-e29b-41d4-a716-446655440004';

async function getAccessToken() {
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

  return verifyResponse.body.accessToken;
}

async function cleanupTestData() {
  const user = await prisma.user.findUnique({ where: { mobile: TEST_MOBILE } });
  if (user) {
    await prisma.session.deleteMany({ where: { userId: user.id } });
    await prisma.user.delete({ where: { id: user.id } });
  }
  await redisClient.del(`${OTP_KEY_PREFIX}${TEST_MOBILE}`);
  await redisClient.del(`${OTP_KEY_PREFIX}${TEST_MOBILE}:device`);
}

describe('User profile API', () => {
  beforeAll(async () => {
    if (!redisClient.isOpen) {
      await redisClient.connect();
    }
  });

  afterAll(async () => {
    await cleanupTestData();
    await prisma.$disconnect();
    if (redisClient.isOpen) {
      await redisClient.quit();
    }
  });

  beforeEach(async () => {
    await cleanupTestData();
  });

  it('returns name in GET /api/auth/me', async () => {
    const accessToken = await getAccessToken();

    const response = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      success: true,
      data: {
        id: expect.any(String),
        mobileNumber: TEST_MOBILE,
        name: null,
        recipeOptions: expect.objectContaining({
          countries: expect.any(Array),
          dietaryPreferences: expect.any(Array),
        }),
      },
    });
  });

  it('updates the user name via PATCH /api/auth/me', async () => {
    const accessToken = await getAccessToken();

    const response = await request(app)
      .patch('/api/auth/me')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ name: '  Ali  ' });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      success: true,
      data: {
        id: expect.any(String),
        mobileNumber: TEST_MOBILE,
        name: 'Ali',
      },
    });

    const user = await prisma.user.findUnique({ where: { mobile: TEST_MOBILE } });
    expect(user.name).toBe('Ali');

    const meResponse = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(meResponse.body.data.name).toBe('Ali');
  });

  it('returns 400 when name is invalid', async () => {
    const accessToken = await getAccessToken();

    const response = await request(app)
      .patch('/api/auth/me')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ name: '' });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('success', false);
    expect(response.body).toHaveProperty('message');
  });

  it('returns 401 when no access token is provided', async () => {
    const response = await request(app)
      .patch('/api/auth/me')
      .send({ name: 'Ali' });

    expect(response.status).toBe(401);
    expect(response.body).toEqual({
      success: false,
      message: 'Authentication token is required',
    });
  });
});
