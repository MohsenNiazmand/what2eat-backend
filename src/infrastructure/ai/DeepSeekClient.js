import axios from 'axios';
import { IRecipeGenerator } from '../../application/recipe/IRecipeGenerator.js';
import { ExternalServiceError } from '../../domain/errors/AppError.js';

export class DeepSeekClient extends IRecipeGenerator {
  constructor({ apiKey, baseURL, model, httpClient } = {}) {
    super();
    this.apiKey = apiKey ?? process.env.DEEPSEEK_API_KEY;
    this.baseURL = baseURL ?? process.env.DEEPSEEK_BASE_URL ?? 'https://api.deepseek.com';
    this.model = model ?? 'deepseek-chat';
    this.httpClient = httpClient ?? axios.create({ baseURL: this.baseURL });
  }

  async generate({ system, user }) {
    if (!this.apiKey) {
      throw new ExternalServiceError('DeepSeek API key is not configured');
    }

    try {
      const response = await this.httpClient.post(
        '/chat/completions',
        {
          model: this.model,
          messages: [
            { role: 'system', content: system },
            { role: 'user', content: user },
          ],
          response_format: { type: 'json_object' },
          temperature: 0.7,
          stream: false,
        },
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const content = response?.data?.choices?.[0]?.message?.content;
      let recipe;

      try {
        recipe = JSON.parse(content);
      } catch (error) {
        throw new ExternalServiceError('DeepSeek returned invalid JSON');
      }

      if (!this._isValidRecipe(recipe)) {
        throw new ExternalServiceError('DeepSeek response does not match the expected recipe schema');
      }

      return recipe;
    } catch (error) {
      if (error instanceof ExternalServiceError) {
        throw error;
      }

      throw new ExternalServiceError('Failed to reach DeepSeek API');
    }
  }

  _isValidRecipe(recipe) {
    if (!recipe || typeof recipe !== 'object') {
      return false;
    }

    const hasTitle = typeof recipe.title === 'string' && recipe.title.trim().length > 0;
    const hasIngredients =
      Array.isArray(recipe.ingredients) &&
      recipe.ingredients.every(
        (item) =>
          item &&
          typeof item === 'object' &&
          typeof item.name === 'string' &&
          item.name.trim().length > 0 &&
          typeof item.amount === 'string' &&
          item.amount.trim().length > 0
      );
    const hasInstructions =
      Array.isArray(recipe.instructions) &&
      recipe.instructions.length > 0 &&
      recipe.instructions.every((step) => typeof step === 'string' && step.trim().length > 0);
    const hasNumbers = ['calories', 'prepTime', 'cookTime', 'servings'].every(
      (key) => typeof recipe[key] === 'number'
    );
    const hasCategory = typeof recipe.category === 'string';

    return hasTitle && hasIngredients && hasInstructions && hasNumbers && hasCategory;
  }
}
