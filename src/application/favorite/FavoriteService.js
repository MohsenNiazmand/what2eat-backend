import {
  ValidationError,
  NotFoundError,
  ConflictError,
} from '../../domain/errors/AppError.js';

export class FavoriteService {
  constructor(favoriteRepository, recipeRepository) {
    this.favoriteRepository = favoriteRepository;
    this.recipeRepository = recipeRepository;
  }

  async addFavorite(userId, input) {
    const recipeId = this._validateRecipeId(input?.recipeId);

    const recipe = await this.recipeRepository.findById(recipeId);
    if (!recipe) {
      throw new NotFoundError('Recipe not found');
    }

    const existing = await this.favoriteRepository.findByUserAndRecipe(userId, recipeId);
    if (existing) {
      throw new ConflictError('Recipe is already in favorites');
    }

    const favorite = await this.favoriteRepository.create(userId, recipeId);

    return {
      id: favorite.id,
      recipeId: favorite.recipeId,
      createdAt: favorite.createdAt,
    };
  }

  async removeFavorite(userId, recipeId) {
    const validRecipeId = this._validateRecipeId(recipeId);

    const existing = await this.favoriteRepository.findByUserAndRecipe(userId, validRecipeId);
    if (!existing) {
      throw new NotFoundError('Favorite not found');
    }

    await this.favoriteRepository.deleteByUserAndRecipe(userId, validRecipeId);

    return { success: true, message: 'Favorite removed successfully' };
  }

  async listFavorites(userId) {
    const favorites = await this.favoriteRepository.listByUserId(userId);

    return favorites.map((favorite) => ({
      id: favorite.id,
      recipeId: favorite.recipeId,
      createdAt: favorite.createdAt,
      recipe: this._toRecipeResponse(favorite.recipe),
    }));
  }

  _validateRecipeId(recipeId) {
    if (typeof recipeId !== 'string' || recipeId.trim().length === 0) {
      throw new ValidationError('recipeId is required and must be a non-empty string');
    }

    return recipeId.trim();
  }

  _toRecipeResponse(recipe) {
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
    };
  }
}
