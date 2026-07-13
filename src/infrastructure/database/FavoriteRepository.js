import { IFavoriteRepository } from '../../application/favorite/IFavoriteRepository.js';
import prisma from './prisma.js';

export class FavoriteRepository extends IFavoriteRepository {
  async findByUserAndRecipe(userId, recipeId) {
    return prisma.favorite.findUnique({
      where: {
        userId_recipeId: { userId, recipeId },
      },
    });
  }

  async create(userId, recipeId) {
    return prisma.favorite.create({
      data: { userId, recipeId },
    });
  }

  async deleteByUserAndRecipe(userId, recipeId) {
    return prisma.favorite.delete({
      where: {
        userId_recipeId: { userId, recipeId },
      },
    });
  }

  async listByUserId(userId) {
    return prisma.favorite.findMany({
      where: { userId },
      include: { recipe: true },
      orderBy: { createdAt: 'desc' },
    });
  }
}
