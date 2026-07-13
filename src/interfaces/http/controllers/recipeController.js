import { PromptBuilder } from '../../../application/recipe/PromptBuilder.js';
import { GenerateRecipeUseCase } from '../../../application/recipe/GenerateRecipeUseCase.js';
import { DeepSeekClient } from '../../../infrastructure/ai/DeepSeekClient.js';
import { RecipeRepository } from '../../../infrastructure/database/RecipeRepository.js';

const generateRecipeUseCase = new GenerateRecipeUseCase(
  new PromptBuilder(),
  new DeepSeekClient(),
  new RecipeRepository()
);

export async function generateRecipe(req, res, next) {
  try {
    const result = await generateRecipeUseCase.execute(req.body);
    res.status(201).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}
