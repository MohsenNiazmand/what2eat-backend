import request from 'supertest';
import app from '../../../src/interfaces/http/app.js';
import prisma from '../../../src/infrastructure/database/prisma.js';
import redisClient from '../../../src/infrastructure/redis/client.js';

const OTP_KEY_PREFIX = 'otp:';
const TEST_MOBILE = '09124567890';
const TEST_DEVICE_ID = '880e8400-e29b-41d4-a716-446655440003';

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
    await prisma.preference.deleteMany({ where: { userId: user.id } });
    await prisma.session.deleteMany({ where: { userId: user.id } });
    await prisma.user.delete({ where: { id: user.id } });
  }
  await redisClient.del(`${OTP_KEY_PREFIX}${TEST_MOBILE}`);
  await redisClient.del(`${OTP_KEY_PREFIX}${TEST_MOBILE}:device`);
}

describe('Preferences API', () => {
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

  it('returns 401 when no access token is provided', async () => {
    const response = await request(app).get('/api/preferences');

    expect(response.status).toBe(401);
    expect(response.body).toEqual({
      success: false,
      message: 'Authentication token is required',
    });
  });

  it('returns 404 when preferences do not exist', async () => {
    const accessToken = await getAccessToken();

    const response = await request(app)
      .get('/api/preferences')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(response.status).toBe(404);
    expect(response.body).toEqual({
      success: false,
      message: 'Preferences not found',
    });
  });

  it('creates preferences via PUT and returns them via GET', async () => {
    const accessToken = await getAccessToken();
    const payload = {
      dietaryRestrictions: ['Vegan', 'Gluten-free'],
      preferredCuisines: ['Persian', 'Italian'],
    };

    const putResponse = await request(app)
      .put('/api/preferences')
      .set('Authorization', `Bearer ${accessToken}`)
      .send(payload);

    expect(putResponse.status).toBe(200);
    expect(putResponse.body.success).toBe(true);
    expect(putResponse.body.data).toMatchObject({
      id: expect.any(String),
      dietaryRestrictions: payload.dietaryRestrictions,
      preferredCuisines: payload.preferredCuisines,
    });
    expect(putResponse.body.data.updatedAt).toEqual(expect.any(String));

    const getResponse = await request(app)
      .get('/api/preferences')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(getResponse.status).toBe(200);
    expect(getResponse.body.data.id).toBe(putResponse.body.data.id);
    expect(getResponse.body.data.dietaryRestrictions).toEqual(payload.dietaryRestrictions);
    expect(getResponse.body.data.preferredCuisines).toEqual(payload.preferredCuisines);

    const user = await prisma.user.findUnique({ where: { mobile: TEST_MOBILE } });
    const persisted = await prisma.preference.findUnique({ where: { userId: user.id } });
    expect(persisted).not.toBeNull();
    expect(persisted.dietaryRestrictions).toEqual(payload.dietaryRestrictions);
  });

  it('updates existing preferences via PUT', async () => {
    const accessToken = await getAccessToken();

    await request(app)
      .put('/api/preferences')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ dietaryRestrictions: ['Vegan'], preferredCuisines: ['Persian'] });

    const response = await request(app)
      .put('/api/preferences')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ dietaryRestrictions: [], preferredCuisines: ['Italian'] });

    expect(response.status).toBe(200);
    expect(response.body.data.dietaryRestrictions).toEqual([]);
    expect(response.body.data.preferredCuisines).toEqual(['Italian']);
  });

  it('returns 400 when the request body is invalid', async () => {
    const accessToken = await getAccessToken();

    const response = await request(app)
      .put('/api/preferences')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ dietaryRestrictions: 'Vegan', preferredCuisines: [] });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('success', false);
    expect(response.body).toHaveProperty('message');
  });

  it('deletes preferences via DELETE', async () => {
    const accessToken = await getAccessToken();

    await request(app)
      .put('/api/preferences')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ dietaryRestrictions: ['Vegan'], preferredCuisines: ['Persian'] });

    const deleteResponse = await request(app)
      .delete('/api/preferences')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(deleteResponse.status).toBe(200);
    expect(deleteResponse.body).toEqual({
      success: true,
      message: 'Preferences deleted successfully',
    });

    const getResponse = await request(app)
      .get('/api/preferences')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(getResponse.status).toBe(404);
  });

  it('returns 404 when deleting non-existent preferences', async () => {
    const accessToken = await getAccessToken();

    const response = await request(app)
      .delete('/api/preferences')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(response.status).toBe(404);
    expect(response.body).toEqual({
      success: false,
      message: 'Preferences not found',
    });
  });
});
