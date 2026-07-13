import { PromptBuilder } from '../../../application/recipe/PromptBuilder.js';
import { GenerateRecipeUseCase } from '../../../application/recipe/GenerateRecipeUseCase.js';
import { ListRecipesUseCase } from '../../../application/recipe/ListRecipesUseCase.js';
import { GetRecipeUseCase } from '../../../application/recipe/GetRecipeUseCase.js';
import { createRecipeGenerator } from '../../../infrastructure/ai/recipeGeneratorFactory.js';
import { RecipeRepository } from '../../../infrastructure/database/RecipeRepository.js';

const recipeRepository = new RecipeRepository();

const generateRecipeUseCase = new GenerateRecipeUseCase(
  new PromptBuilder(),
  createRecipeGenerator(),
  recipeRepository
);

const listRecipesUseCase = new ListRecipesUseCase(recipeRepository);
const getRecipeUseCase = new GetRecipeUseCase(recipeRepository);

export async function generateRecipe(req, res, next) {
  try {
    const result = await generateRecipeUseCase.execute(req.body);
    res.status(201).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

export async function listRecipes(req, res, next) {
  try {
    const result = await listRecipesUseCase.execute({
      q: req.query.q,
      category: req.query.category,
      page: req.query.page ? Number(req.query.page) : undefined,
      limit: req.query.limit ? Number(req.query.limit) : undefined,
    });
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

export async function getRecipe(req, res, next) {
  try {
    const result = await getRecipeUseCase.execute(req.params.id);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}
