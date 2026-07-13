import request from 'supertest';
import app from '../../../src/interfaces/http/app.js';
import prisma from '../../../src/infrastructure/database/prisma.js';
import redisClient from '../../../src/infrastructure/redis/client.js';

const OTP_KEY_PREFIX = 'otp:';
const TEST_MOBILE = '09126789012';
const TEST_DEVICE_ID = 'aa0e8400-e29b-41d4-a716-446655440005';

const testRecipe = {
  title: 'غذای مورد علاقه',
  description: 'توضیح',
  ingredients: [{ name: 'گوجه', amount: '2 عدد' }],
  instructions: ['مرحله 1'],
  category: 'پاستا',
  prepTime: 10,
  cookTime: 20,
  servings: 2,
  calories: 300,
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

async function createTestRecipe() {
  return prisma.recipe.create({ data: testRecipe });
}

async function cleanupTestData() {
  const user = await prisma.user.findUnique({ where: { mobile: TEST_MOBILE } });
  if (user) {
    await prisma.favorite.deleteMany({ where: { userId: user.id } });
    await prisma.session.deleteMany({ where: { userId: user.id } });
    await prisma.user.delete({ where: { id: user.id } });
  }
  await prisma.recipe.deleteMany({ where: { title: testRecipe.title } });
  await redisClient.del(`${OTP_KEY_PREFIX}${TEST_MOBILE}`);
  await redisClient.del(`${OTP_KEY_PREFIX}${TEST_MOBILE}:device`);
}

describe('Favorites API', () => {
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
    const response = await request(app).get('/api/favorites');

    expect(response.status).toBe(401);
    expect(response.body).toEqual({
      success: false,
      message: 'Authentication token is required',
    });
  });

  it('returns an empty list when the user has no favorites', async () => {
    const accessToken = await getAccessToken();

    const response = await request(app)
      .get('/api/favorites')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ success: true, data: [] });
  });

  it('adds a favorite and lists it with recipe details', async () => {
    const recipe = await createTestRecipe();
    const accessToken = await getAccessToken();

    const addResponse = await request(app)
      .post('/api/favorites')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ recipeId: recipe.id });

    expect(addResponse.status).toBe(201);
    expect(addResponse.body.success).toBe(true);
    expect(addResponse.body.data).toMatchObject({
      id: expect.any(String),
      recipeId: recipe.id,
    });
    expect(addResponse.body.data.createdAt).toEqual(expect.any(String));

    const listResponse = await request(app)
      .get('/api/favorites')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(listResponse.status).toBe(200);
    expect(listResponse.body.data).toHaveLength(1);
    expect(listResponse.body.data[0]).toMatchObject({
      id: addResponse.body.data.id,
      recipeId: recipe.id,
      recipe: {
        id: recipe.id,
        title: testRecipe.title,
        description: testRecipe.description,
        ingredients: testRecipe.ingredients,
        instructions: testRecipe.instructions,
        category: testRecipe.category,
        prepTime: testRecipe.prepTime,
        cookTime: testRecipe.cookTime,
        servings: testRecipe.servings,
        calories: testRecipe.calories,
      },
    });

    const persisted = await prisma.favorite.findUnique({
      where: {
        userId_recipeId: {
          userId: (await prisma.user.findUnique({ where: { mobile: TEST_MOBILE } })).id,
          recipeId: recipe.id,
        },
      },
    });
    expect(persisted).not.toBeNull();
  });

  it('returns 409 when adding a duplicate favorite', async () => {
    const recipe = await createTestRecipe();
    const accessToken = await getAccessToken();

    await request(app)
      .post('/api/favorites')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ recipeId: recipe.id });

    const response = await request(app)
      .post('/api/favorites')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ recipeId: recipe.id });

    expect(response.status).toBe(409);
    expect(response.body).toEqual({
      success: false,
      message: 'Recipe is already in favorites',
    });
  });

  it('returns 404 when the recipe does not exist', async () => {
    const accessToken = await getAccessToken();

    const response = await request(app)
      .post('/api/favorites')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ recipeId: '00000000-0000-0000-0000-000000000000' });

    expect(response.status).toBe(404);
    expect(response.body).toEqual({
      success: false,
      message: 'Recipe not found',
    });
  });

  it('returns 400 when recipeId is missing', async () => {
    const accessToken = await getAccessToken();

    const response = await request(app)
      .post('/api/favorites')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({});

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('success', false);
    expect(response.body).toHaveProperty('message');
  });

  it('removes a favorite via DELETE', async () => {
    const recipe = await createTestRecipe();
    const accessToken = await getAccessToken();

    await request(app)
      .post('/api/favorites')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ recipeId: recipe.id });

    const deleteResponse = await request(app)
      .delete(`/api/favorites/${recipe.id}`)
      .set('Authorization', `Bearer ${accessToken}`);

    expect(deleteResponse.status).toBe(200);
    expect(deleteResponse.body).toEqual({
      success: true,
      message: 'Favorite removed successfully',
    });

    const listResponse = await request(app)
      .get('/api/favorites')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(listResponse.body.data).toEqual([]);
  });

  it('returns 404 when removing a non-existent favorite', async () => {
    const recipe = await createTestRecipe();
    const accessToken = await getAccessToken();

    const response = await request(app)
      .delete(`/api/favorites/${recipe.id}`)
      .set('Authorization', `Bearer ${accessToken}`);

    expect(response.status).toBe(404);
    expect(response.body).toEqual({
      success: false,
      message: 'Favorite not found',
    });
  });
});
