import { ValidationError, NotFoundError } from '../../domain/errors/AppError.js';

export class GetRecipeUseCase {
  constructor(recipeRepository) {
    this.recipeRepository = recipeRepository;
  }

  async execute(id) {
    const recipeId = this._validateId(id);
    const recipe = await this.recipeRepository.findById(recipeId);

    if (!recipe) {
      throw new NotFoundError('Recipe not found');
    }

    return {
      id: recipe.id,
      title: recipe.title,
      description: recipe.description,
      ingredients: recipe.ingredients,
      instructions: recipe.instructions,
      category: recipe.category,
      prepTime: recipe.prepTime,
      cookTime: recipe.cookTime,
      servings: recipe.servings,
      calories: recipe.calories,
      createdAt: recipe.createdAt,
      updatedAt: recipe.updatedAt,
    };
  }

  _validateId(id) {
    if (typeof id !== 'string' || id.trim().length === 0) {
      throw new ValidationError('recipe id is required and must be a non-empty string');
    }

    return id.trim();
  }
}
