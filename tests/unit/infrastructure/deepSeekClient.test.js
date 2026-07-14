import { jest } from '@jest/globals';
import { DeepSeekClient } from '../../../src/infrastructure/ai/DeepSeekClient.js';
import { IRecipeGenerator } from '../../../src/application/recipe/IRecipeGenerator.js';
import { ExternalServiceError } from '../../../src/domain/errors/AppError.js';

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

const makeClient = ({ apiKey, baseURL, bodyContent, error } = {}) => {
  const httpClient = {
    post: jest.fn().mockImplementation(() => {
      if (error) {
        return Promise.reject(error);
      }
      return Promise.resolve({
        data: {
          choices: [
            {
              message: {
                content: bodyContent,
              },
            },
          ],
        },
      });
    }),
  };

  return {
    client: new DeepSeekClient({ apiKey, baseURL, httpClient }),
    httpClient,
  };
};

describe('DeepSeekClient', () => {
  it('is an instance of IRecipeGenerator', () => {
    const { client } = makeClient({ apiKey: 'test-key' });

    expect(client).toBeInstanceOf(IRecipeGenerator);
  });

  it('calls httpClient.post with the correct DeepSeek arguments', async () => {
    const { client, httpClient } = makeClient({ apiKey: 'test-key', bodyContent: JSON.stringify(validRecipe) });

    await client.generate(validPrompt);

    expect(httpClient.post).toHaveBeenCalledTimes(1);
    expect(httpClient.post).toHaveBeenCalledWith(
      '/chat/completions',
      expect.objectContaining({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: validPrompt.system },
          { role: 'user', content: validPrompt.user },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.3,
        stream: false,
      }),
      expect.objectContaining({
        headers: {
          Authorization: 'Bearer test-key',
          'Content-Type': 'application/json',
        },
      })
    );
  });

  it('uses AI_TEMPERATURE from env when set', async () => {
    const originalTemperature = process.env.AI_TEMPERATURE;
    process.env.AI_TEMPERATURE = '0.5';

    const { client, httpClient } = makeClient({ apiKey: 'test-key', bodyContent: JSON.stringify(validRecipe) });

    await client.generate(validPrompt);

    expect(httpClient.post).toHaveBeenCalledWith(
      '/chat/completions',
      expect.objectContaining({ temperature: 0.5 }),
      expect.any(Object)
    );

    if (originalTemperature === undefined) {
      delete process.env.AI_TEMPERATURE;
    } else {
      process.env.AI_TEMPERATURE = originalTemperature;
    }
  });

  it('returns the parsed recipe when DeepSeek returns valid JSON', async () => {
    const { client } = makeClient({ apiKey: 'test-key', bodyContent: JSON.stringify(validRecipe) });

    const result = await client.generate(validPrompt);

    expect(result).toEqual(validRecipe);
  });

  it('normalizes numeric fields returned as Persian-digit strings', async () => {
    const recipeWithPersianNumbers = {
      ...validRecipe,
      calories: '۳۰۰',
      prepTime: '۱۰',
      cookTime: '۲۰',
      servings: '۲',
    };
    const { client } = makeClient({
      apiKey: 'test-key',
      bodyContent: JSON.stringify(recipeWithPersianNumbers),
    });

    const result = await client.generate(validPrompt);

    expect(result).toEqual(validRecipe);
  });

  it('throws ExternalServiceError when DeepSeek returns invalid JSON', async () => {
    const { client } = makeClient({ apiKey: 'test-key', bodyContent: 'not-json' });

    await expect(client.generate(validPrompt)).rejects.toThrow(ExternalServiceError);
    await expect(client.generate(validPrompt)).rejects.toThrow('DeepSeek returned invalid JSON');
  });

  it('throws ExternalServiceError when the parsed JSON is missing required fields', async () => {
    const malformedRecipe = { ...validRecipe };
    delete malformedRecipe.instructions;
    const { client } = makeClient({ apiKey: 'test-key', bodyContent: JSON.stringify(malformedRecipe) });

    await expect(client.generate(validPrompt)).rejects.toThrow(ExternalServiceError);
    await expect(client.generate(validPrompt)).rejects.toThrow('DeepSeek response does not match the expected recipe schema');
  });

  it('throws ExternalServiceError when httpClient.post rejects', async () => {
    const { client } = makeClient({ apiKey: 'test-key', error: new Error('network failure') });

    await expect(client.generate(validPrompt)).rejects.toThrow(ExternalServiceError);
    await expect(client.generate(validPrompt)).rejects.toThrow('Failed to reach DeepSeek API');
  });

  it('throws ExternalServiceError when the API key is not configured', async () => {
    const originalKey = process.env.DEEPSEEK_API_KEY;
    delete process.env.DEEPSEEK_API_KEY;

    const { client } = makeClient({ apiKey: undefined, bodyContent: JSON.stringify(validRecipe) });

    await expect(client.generate(validPrompt)).rejects.toThrow(ExternalServiceError);
    await expect(client.generate(validPrompt)).rejects.toThrow('DeepSeek API key is not configured');

    process.env.DEEPSEEK_API_KEY = originalKey;
  });
});
