import { IRecipeRepository } from '../../application/recipe/IRecipeRepository.js';
import prisma from './prisma.js';

export class RecipeRepository extends IRecipeRepository {
  async create(recipe) {
    return prisma.recipe.create({
      data: {
        title: recipe.title,
        description: recipe.description,
        ingredients: recipe.ingredients,
        instructions: recipe.instructions,
        category: recipe.category,
        prepTime: recipe.prepTime,
        cookTime: recipe.cookTime,
        servings: recipe.servings,
        calories: recipe.calories,
      },
    });
  }

  async findById(id) {
    return prisma.recipe.findUnique({ where: { id } });
  }
}
