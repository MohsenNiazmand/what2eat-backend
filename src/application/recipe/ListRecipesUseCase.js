import { ValidationError } from '../../domain/errors/AppError.js';

export class ListRecipesUseCase {
  constructor(recipeRepository) {
    this.recipeRepository = recipeRepository;
  }

  async execute(input = {}) {
    const { q, category, page, limit } = this._validate(input);

    const { items, total } = await this.recipeRepository.search({ q, category, page, limit });

    return {
      items: items.map((recipe) => this._toResponse(recipe)),
      pagination: {
        page,
        limit,
        total,
        totalPages: total === 0 ? 0 : Math.ceil(total / limit),
      },
    };
  }

  _validate(input) {
    const q = input.q;
    const category = input.category;

    if (q !== undefined && typeof q !== 'string') {
      throw new ValidationError('q must be a string');
    }

    if (category !== undefined && typeof category !== 'string') {
      throw new ValidationError('category must be a string');
    }

    const page = input.page === undefined ? 1 : input.page;
    if (!Number.isInteger(page) || page <= 0) {
      throw new ValidationError('page must be a positive integer');
    }

    const limit = input.limit === undefined ? 20 : input.limit;
    if (!Number.isInteger(limit) || limit <= 0 || limit > 100) {
      throw new ValidationError('limit must be a positive integer up to 100');
    }

    return {
      q: q?.trim() || undefined,
      category: category?.trim() || undefined,
      page,
      limit,
    };
  }

  _toResponse(recipe) {
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
}
