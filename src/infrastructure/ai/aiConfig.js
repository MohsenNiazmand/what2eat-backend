export function getAiConfig() {
  return {
    provider: process.env.AI_PROVIDER ?? 'deepseek',
    baseURL: process.env.AI_BASE_URL ?? process.env.DEEPSEEK_BASE_URL ?? 'https://api.deepseek.com',
    apiKey: process.env.AI_API_KEY ?? process.env.DEEPSEEK_API_KEY,
    model: process.env.AI_MODEL ?? 'deepseek-chat',
  };
}
