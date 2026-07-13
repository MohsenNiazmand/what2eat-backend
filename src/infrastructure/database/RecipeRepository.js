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

  async search({ q, category, page, limit }) {
    const where = {};

    if (category) {
      where.category = { equals: category, mode: 'insensitive' };
    }

    if (q) {
      where.OR = [
        { title: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
      ];
    }

    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      prisma.recipe.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.recipe.count({ where }),
    ]);

    return { items, total };
  }
}
