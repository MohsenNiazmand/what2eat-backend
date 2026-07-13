import { getAiConfig } from './aiConfig.js';
import { OpenAICompatibleClient } from './OpenAICompatibleClient.js';

export function createRecipeGenerator() {
  const config = getAiConfig();
  return new OpenAICompatibleClient({
    apiKey: config.apiKey,
    baseURL: config.baseURL,
    model: config.model,
  });
}
