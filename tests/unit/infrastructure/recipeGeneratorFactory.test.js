import { jest } from '@jest/globals';

const validPrompt = {
  system: 'سیستم',
  user: 'کاربر',
};

const validRecipe = {
  title: 'غذای تست',
  description: 'توضیح',
  ingredients: [{ name: 'گوجه', amount: '2 عدد' }],
  instructions: ['مرحله 1', 'مرحله 2'],
  calories: 300,
  prepTime: 10,
  cookTime: 20,
  servings: 2,
  category: 'پاستا',
};

const mockHttpClient = {
  post: jest.fn().mockResolvedValue({
    data: {
      choices: [{ message: { content: JSON.stringify(validRecipe) } }],
    },
  }),
};

const mockAxiosCreate = jest.fn(() => mockHttpClient);

jest.unstable_mockModule('axios', () => ({
  default: {
    create: mockAxiosCreate,
  },
}));

const { createRecipeGenerator } = await import('../../../src/infrastructure/ai/recipeGeneratorFactory.js');
const { IRecipeGenerator } = await import('../../../src/application/recipe/IRecipeGenerator.js');

const ENV_KEYS = [
  'AI_PROVIDER',
  'AI_BASE_URL',
  'AI_API_KEY',
  'AI_MODEL',
  'DEEPSEEK_API_KEY',
  'DEEPSEEK_BASE_URL',
];

describe('createRecipeGenerator', () => {
  let savedEnv;

  beforeEach(() => {
    savedEnv = {};
    for (const key of ENV_KEYS) {
      savedEnv[key] = process.env[key];
      delete process.env[key];
    }

    mockHttpClient.post.mockClear();
    mockAxiosCreate.mockClear();
  });

  afterEach(() => {
    for (const key of ENV_KEYS) {
      if (savedEnv[key] === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = savedEnv[key];
      }
    }
  });

  it('returns an instance of IRecipeGenerator', () => {
    process.env.AI_API_KEY = 'test-key';

    const generator = createRecipeGenerator();

    expect(generator).toBeInstanceOf(IRecipeGenerator);
  });

  it('returns a client configured with the resolved base URL, model, and API key', async () => {
    process.env.AI_BASE_URL = 'https://api.reseller.example/v1';
    process.env.AI_API_KEY = 'reseller-key';
    process.env.AI_MODEL = 'custom-model';

    const generator = createRecipeGenerator();
    await generator.generate(validPrompt);

    expect(mockAxiosCreate).toHaveBeenCalledWith({ baseURL: 'https://api.reseller.example/v1' });
    expect(mockHttpClient.post).toHaveBeenCalledWith(
      '/chat/completions',
      expect.objectContaining({ model: 'custom-model' }),
      expect.objectContaining({
        headers: {
          Authorization: 'Bearer reseller-key',
          'Content-Type': 'application/json',
        },
      })
    );
  });
});
