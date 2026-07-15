import { jest } from '@jest/globals';

const validGeneratedRecipe = {
  title: 'غذای تست',
  description: 'توضیح کوتاه',
  ingredients: [{ name: 'گوجه', amount: '2 عدد' }],
  instructions: ['مرحله 1', 'مرحله 2'],
  calories: 300,
  prepTime: 10,
  cookTime: 20,
  servings: 2,
  category: 'پاستا',
};

const mockGenerate = jest.fn();

jest.unstable_mockModule('../../../src/infrastructure/ai/recipeGeneratorFactory.js', () => ({
  createRecipeGenerator: jest.fn().mockImplementation(() => ({
    generate: mockGenerate,
  })),
}));

const { default: request } = await import('supertest');
const { default: app } = await import('../../../src/interfaces/http/app.js');
const { default: prisma } = await import('../../../src/infrastructure/database/prisma.js');
const { default: redisClient } = await import('../../../src/infrastructure/redis/client.js');
const { ExternalServiceError } = await import('../../../src/domain/errors/AppError.js');

const OTP_KEY_PREFIX = 'otp:';
const TEST_MOBILE = '09123456789';
const TEST_DEVICE_ID = '770e8400-e29b-41d4-a716-446655440002';

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
  await prisma.recipe.deleteMany({ where: { title: validGeneratedRecipe.title } });
  await prisma.session.deleteMany({ where: { user: { mobile: TEST_MOBILE } } });
  await prisma.user.deleteMany({ where: { mobile: TEST_MOBILE } });
  await redisClient.del(`${OTP_KEY_PREFIX}${TEST_MOBILE}`);
  await redisClient.del(`${OTP_KEY_PREFIX}${TEST_MOBILE}:device`);
}

describe('POST /api/recipes/generate', () => {
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
    mockGenerate.mockReset();
    mockGenerate.mockResolvedValue(validGeneratedRecipe);
  });

  it('returns 401 when no access token is provided', async () => {
    const response = await request(app)
      .post('/api/recipes/generate')
      .send({ ingredients: ['گوجه'] });

    expect(response.status).toBe(401);
    expect(response.body).toEqual({
      success: false,
      message: 'Authentication token is required',
    });
  });

  it('returns 400 when the request body is invalid', async () => {
    const accessToken = await getAccessToken();

    const response = await request(app)
      .post('/api/recipes/generate')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ ingredients: [] });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('success', false);
    expect(response.body).toHaveProperty('message');
    expect(mockGenerate).not.toHaveBeenCalled();
  });

  it('returns 201 with schema-valid data including id and persists the recipe', async () => {
    const accessToken = await getAccessToken();

    const response = await request(app)
      .post('/api/recipes/generate')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        ingredients: ['گوجه', 'پونه'],
        tools: ['تابه'],
        calorieLimit: 400,
        servings: 2,
      });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toMatchObject({
      id: expect.any(String),
      title: validGeneratedRecipe.title,
      description: validGeneratedRecipe.description,
      ingredients: validGeneratedRecipe.ingredients,
      instructions: validGeneratedRecipe.instructions,
      calories: validGeneratedRecipe.calories,
      prepTime: validGeneratedRecipe.prepTime,
      cookTime: validGeneratedRecipe.cookTime,
      servings: validGeneratedRecipe.servings,
      category: validGeneratedRecipe.category,
    });
    expect(response.body.data.createdAt).toEqual(expect.any(String));
    expect(response.body.data.updatedAt).toEqual(expect.any(String));

    expect(mockGenerate).toHaveBeenCalledTimes(1);

    const persisted = await prisma.recipe.findUnique({
      where: { id: response.body.data.id },
    });

    expect(persisted).not.toBeNull();
    expect(persisted.title).toBe(validGeneratedRecipe.title);
    expect(persisted.calories).toBe(validGeneratedRecipe.calories);
    expect(persisted.ingredients).toEqual(validGeneratedRecipe.ingredients);
    expect(persisted.instructions).toEqual(validGeneratedRecipe.instructions);
  });

  it('returns 422 with NON_PERSIAN_TEXT when Latin letters are used', async () => {
    const accessToken = await getAccessToken();

    const response = await request(app)
      .post('/api/recipes/generate')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ ingredients: ['tomato'] });

    expect(response.status).toBe(422);
    expect(response.body).toEqual({
      success: false,
      message: 'فقط حروف فارسی مجاز است. عدد فارسی یا انگلیسی مشکلی ندارد.',
      code: 'NON_PERSIAN_TEXT',
    });
    expect(mockGenerate).not.toHaveBeenCalled();
  });

  it('returns 422 with FORBIDDEN_INGREDIENTS when ingredients are not allowed', async () => {
    const accessToken = await getAccessToken();

    const response = await request(app)
      .post('/api/recipes/generate')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ ingredients: ['مدفوع', 'ادرار'] });

    expect(response.status).toBe(422);
    expect(response.body).toEqual({
      success: false,
      message: 'برخی مواد وارد شده برای پخت غذا مناسب نیست. لطفاً مواد خوردنی واقعی وارد کنید.',
      code: 'FORBIDDEN_INGREDIENTS',
    });
    expect(mockGenerate).not.toHaveBeenCalled();
  });

  it('returns 502 when the generator rejects', async () => {
    mockGenerate.mockRejectedValue(new ExternalServiceError('Failed to reach DeepSeek API'));
    const accessToken = await getAccessToken();

    const response = await request(app)
      .post('/api/recipes/generate')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ ingredients: ['گوجه'] });

    expect(response.status).toBe(502);
    expect(response.body).toEqual({
      success: false,
      message: 'Failed to reach DeepSeek API',
    });

    const recipes = await prisma.recipe.findMany({ where: { title: validGeneratedRecipe.title } });
    expect(recipes).toHaveLength(0);
  });
});
