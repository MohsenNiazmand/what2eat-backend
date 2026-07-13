import request from 'supertest';
import app from '../../../src/interfaces/http/app.js';
import prisma from '../../../src/infrastructure/database/prisma.js';
import redisClient from '../../../src/infrastructure/redis/client.js';

const OTP_KEY_PREFIX = 'otp:';
const TEST_MOBILE = '09127890123';
const TEST_DEVICE_ID = 'bb0e8400-e29b-41d4-a716-446655440006';

const recipeA = {
  title: 'خورشت قورمه سبزی',
  description: 'غذای سنتی ایرانی',
  ingredients: [{ name: 'سبزی', amount: '500g' }],
  instructions: ['مرحله 1'],
  category: 'خورشت',
  prepTime: 30,
  cookTime: 120,
  servings: 4,
  calories: 450,
};

const recipeB = {
  title: 'کباب کوبیده',
  description: 'غذای گریل',
  ingredients: [{ name: 'گوشت', amount: '500g' }],
  instructions: ['مرحله 1'],
  category: 'کباب',
  prepTime: 20,
  cookTime: 15,
  servings: 2,
  calories: 600,
};

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
  await prisma.recipe.deleteMany({
    where: { title: { in: [recipeA.title, recipeB.title] } },
  });
  const user = await prisma.user.findUnique({ where: { mobile: TEST_MOBILE } });
  if (user) {
    await prisma.session.deleteMany({ where: { userId: user.id } });
    await prisma.user.delete({ where: { id: user.id } });
  }
  await redisClient.del(`${OTP_KEY_PREFIX}${TEST_MOBILE}`);
  await redisClient.del(`${OTP_KEY_PREFIX}${TEST_MOBILE}:device`);
}

describe('Recipe listing and search API', () => {
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
    const response = await request(app).get('/api/recipes');

    expect(response.status).toBe(401);
    expect(response.body).toEqual({
      success: false,
      message: 'Authentication token is required',
    });
  });

  it('lists recipes with pagination', async () => {
    await prisma.recipe.create({ data: recipeA });
    await prisma.recipe.create({ data: recipeB });
    const accessToken = await getAccessToken();

    const response = await request(app)
      .get('/api/recipes?page=1&limit=10')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.items).toHaveLength(2);
    expect(response.body.data.pagination).toEqual({
      page: 1,
      limit: 10,
      total: 2,
      totalPages: 1,
    });
    expect(response.body.data.items[0]).toMatchObject({
      title: expect.any(String),
      category: expect.any(String),
    });
  });

  it('searches recipes by query', async () => {
    await prisma.recipe.create({ data: recipeA });
    await prisma.recipe.create({ data: recipeB });
    const accessToken = await getAccessToken();

    const response = await request(app)
      .get('/api/recipes?q=قورمه')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(response.status).toBe(200);
    expect(response.body.data.items).toHaveLength(1);
    expect(response.body.data.items[0].title).toBe(recipeA.title);
  });

  it('filters recipes by category', async () => {
    await prisma.recipe.create({ data: recipeA });
    await prisma.recipe.create({ data: recipeB });
    const accessToken = await getAccessToken();

    const response = await request(app)
      .get('/api/recipes?category=کباب')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(response.status).toBe(200);
    expect(response.body.data.items).toHaveLength(1);
    expect(response.body.data.items[0].title).toBe(recipeB.title);
  });

  it('returns 400 for invalid pagination query params', async () => {
    const accessToken = await getAccessToken();

    const response = await request(app)
      .get('/api/recipes?limit=200')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('success', false);
    expect(response.body).toHaveProperty('message');
  });

  it('returns a single recipe by id', async () => {
    const created = await prisma.recipe.create({ data: recipeA });
    const accessToken = await getAccessToken();

    const response = await request(app)
      .get(`/api/recipes/${created.id}`)
      .set('Authorization', `Bearer ${accessToken}`);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      success: true,
      data: {
        id: created.id,
        title: recipeA.title,
        description: recipeA.description,
        ingredients: recipeA.ingredients,
        instructions: recipeA.instructions,
        category: recipeA.category,
        prepTime: recipeA.prepTime,
        cookTime: recipeA.cookTime,
        servings: recipeA.servings,
        calories: recipeA.calories,
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      },
    });
  });

  it('returns 404 when the recipe does not exist', async () => {
    const accessToken = await getAccessToken();

    const response = await request(app)
      .get('/api/recipes/00000000-0000-0000-0000-000000000000')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(response.status).toBe(404);
    expect(response.body).toEqual({
      success: false,
      message: 'Recipe not found',
    });
  });
});
