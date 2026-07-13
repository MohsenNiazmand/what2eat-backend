import { jest } from '@jest/globals';
import {
  ValidationError,
  NotFoundError,
  ConflictError,
} from '../../../src/domain/errors/AppError.js';
import { FavoriteService } from '../../../src/application/favorite/FavoriteService.js';

const recipeRecord = {
  id: 'recipe-uuid-1',
  title: 'غذای تست',
  description: 'توضیح',
  ingredients: [{ name: 'گوجه', amount: '2 عدد' }],
  instructions: ['مرحله 1'],
  category: 'پاستا',
  prepTime: 10,
  cookTime: 20,
  servings: 2,
  calories: 300,
};

const favoriteRecord = {
  id: 'favorite-uuid-1',
  userId: 'user-uuid-1',
  recipeId: 'recipe-uuid-1',
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  recipe: recipeRecord,
};

function makeService({
  recipeFindResult = recipeRecord,
  favoriteFindResult = null,
  createResult = favoriteRecord,
  listResult = [favoriteRecord],
} = {}) {
  const favoriteRepository = {
    findByUserAndRecipe: jest.fn().mockResolvedValue(favoriteFindResult),
    create: jest.fn().mockResolvedValue(createResult),
    deleteByUserAndRecipe: jest.fn().mockResolvedValue(createResult),
    listByUserId: jest.fn().mockResolvedValue(listResult),
  };
  const recipeRepository = {
    findById: jest.fn().mockResolvedValue(recipeFindResult),
  };

  const service = new FavoriteService(favoriteRepository, recipeRepository);

  return { service, favoriteRepository, recipeRepository };
}

describe('FavoriteService', () => {
  describe('addFavorite', () => {
    it('adds a favorite when the recipe exists and is not already favorited', async () => {
      const { service, favoriteRepository, recipeRepository } = makeService();

      const result = await service.addFavorite('user-uuid-1', { recipeId: 'recipe-uuid-1' });

      expect(recipeRepository.findById).toHaveBeenCalledWith('recipe-uuid-1');
      expect(favoriteRepository.findByUserAndRecipe).toHaveBeenCalledWith('user-uuid-1', 'recipe-uuid-1');
      expect(favoriteRepository.create).toHaveBeenCalledWith('user-uuid-1', 'recipe-uuid-1');
      expect(result).toEqual({
        id: favoriteRecord.id,
        recipeId: favoriteRecord.recipeId,
        createdAt: favoriteRecord.createdAt,
      });
    });

    it.each([undefined, '', '   '])('throws ValidationError when recipeId is invalid: %p', async (recipeId) => {
      const { service, favoriteRepository } = makeService();

      await expect(service.addFavorite('user-uuid-1', { recipeId })).rejects.toThrow(ValidationError);
      expect(favoriteRepository.create).not.toHaveBeenCalled();
    });

    it('throws NotFoundError when the recipe does not exist', async () => {
      const { service, favoriteRepository } = makeService({ recipeFindResult: null });

      await expect(service.addFavorite('user-uuid-1', { recipeId: 'missing-recipe' })).rejects.toThrow(NotFoundError);
      expect(favoriteRepository.create).not.toHaveBeenCalled();
    });

    it('throws ConflictError when the recipe is already favorited', async () => {
      const { service, favoriteRepository } = makeService({ favoriteFindResult: favoriteRecord });

      await expect(service.addFavorite('user-uuid-1', { recipeId: 'recipe-uuid-1' })).rejects.toThrow(ConflictError);
      expect(favoriteRepository.create).not.toHaveBeenCalled();
    });
  });

  describe('removeFavorite', () => {
    it('removes an existing favorite', async () => {
      const { service, favoriteRepository } = makeService({ favoriteFindResult: favoriteRecord });

      const result = await service.removeFavorite('user-uuid-1', 'recipe-uuid-1');

      expect(favoriteRepository.deleteByUserAndRecipe).toHaveBeenCalledWith('user-uuid-1', 'recipe-uuid-1');
      expect(result).toEqual({ success: true, message: 'Favorite removed successfully' });
    });

    it('throws ValidationError when recipeId is invalid', async () => {
      const { service, favoriteRepository } = makeService();

      await expect(service.removeFavorite('user-uuid-1', '   ')).rejects.toThrow(ValidationError);
      expect(favoriteRepository.deleteByUserAndRecipe).not.toHaveBeenCalled();
    });

    it('throws NotFoundError when the favorite does not exist', async () => {
      const { service, favoriteRepository } = makeService({ favoriteFindResult: null });

      await expect(service.removeFavorite('user-uuid-1', 'recipe-uuid-1')).rejects.toThrow(NotFoundError);
      expect(favoriteRepository.deleteByUserAndRecipe).not.toHaveBeenCalled();
    });
  });

  describe('listFavorites', () => {
    it('returns favorites with recipe details for the authenticated user', async () => {
      const { service, favoriteRepository } = makeService();

      const result = await service.listFavorites('user-uuid-1');

      expect(favoriteRepository.listByUserId).toHaveBeenCalledWith('user-uuid-1');
      expect(result).toEqual([
        {
          id: favoriteRecord.id,
          recipeId: favoriteRecord.recipeId,
          createdAt: favoriteRecord.createdAt,
          recipe: {
            id: recipeRecord.id,
            title: recipeRecord.title,
            description: recipeRecord.description,
            ingredients: recipeRecord.ingredients,
            instructions: recipeRecord.instructions,
            category: recipeRecord.category,
            prepTime: recipeRecord.prepTime,
            cookTime: recipeRecord.cookTime,
            servings: recipeRecord.servings,
            calories: recipeRecord.calories,
          },
        },
      ]);
    });

    it('returns an empty array when the user has no favorites', async () => {
      const { service } = makeService({ listResult: [] });

      const result = await service.listFavorites('user-uuid-1');

      expect(result).toEqual([]);
    });
  });
});
