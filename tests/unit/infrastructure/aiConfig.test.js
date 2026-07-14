import { getAiConfig } from '../../../src/infrastructure/ai/aiConfig.js';

const ENV_KEYS = [
  'AI_PROVIDER',
  'AI_BASE_URL',
  'AI_API_KEY',
  'AI_MODEL',
  'AI_TEMPERATURE',
  'DEEPSEEK_API_KEY',
  'DEEPSEEK_BASE_URL',
];

describe('getAiConfig', () => {
  let savedEnv;

  beforeEach(() => {
    savedEnv = {};
    for (const key of ENV_KEYS) {
      savedEnv[key] = process.env[key];
      delete process.env[key];
    }
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

  it('returns AI_* values when set', () => {
    process.env.AI_PROVIDER = 'iran-reseller';
    process.env.AI_BASE_URL = 'https://api.example.com/v1';
    process.env.AI_API_KEY = 'ai-key-123';
    process.env.AI_MODEL = 'gpt-4o-mini';

    expect(getAiConfig()).toEqual({
      provider: 'iran-reseller',
      baseURL: 'https://api.example.com/v1',
      apiKey: 'ai-key-123',
      model: 'gpt-4o-mini',
      temperature: 0.3,
    });
  });

  it('reads AI_TEMPERATURE when set to a valid number', () => {
    process.env.AI_TEMPERATURE = '0.5';

    expect(getAiConfig().temperature).toBe(0.5);
  });

  it('falls back to default temperature when AI_TEMPERATURE is invalid', () => {
    process.env.AI_TEMPERATURE = 'not-a-number';

    expect(getAiConfig().temperature).toBe(0.3);
  });

  it('falls back to DEEPSEEK_* when AI_* are absent', () => {
    process.env.DEEPSEEK_API_KEY = 'deepseek-key';
    process.env.DEEPSEEK_BASE_URL = 'https://custom.deepseek.com';

    expect(getAiConfig()).toEqual({
      provider: 'deepseek',
      baseURL: 'https://custom.deepseek.com',
      apiKey: 'deepseek-key',
      model: 'deepseek-chat',
      temperature: 0.3,
    });
  });

  it('falls back to the built-in defaults for baseURL/model when nothing is set', () => {
    expect(getAiConfig()).toEqual({
      provider: 'deepseek',
      baseURL: 'https://api.deepseek.com',
      apiKey: undefined,
      model: 'deepseek-chat',
      temperature: 0.3,
    });
  });
});
