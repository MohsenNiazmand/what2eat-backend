const DEFAULT_TEMPERATURE = 0.3;

function parseTemperature(value) {
  if (value === undefined || value === null || value === '') {
    return DEFAULT_TEMPERATURE;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : DEFAULT_TEMPERATURE;
}

export function getAiConfig() {
  return {
    provider: process.env.AI_PROVIDER ?? 'deepseek',
    baseURL: process.env.AI_BASE_URL ?? process.env.DEEPSEEK_BASE_URL ?? 'https://api.deepseek.com',
    apiKey: process.env.AI_API_KEY ?? process.env.DEEPSEEK_API_KEY,
    model: process.env.AI_MODEL ?? 'deepseek-chat',
    temperature: parseTemperature(process.env.AI_TEMPERATURE),
  };
}
