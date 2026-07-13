import { jest } from '@jest/globals';
import { ValidationError } from '../../../src/domain/errors/AppError.js';
import { ListRecipesUseCase } from '../../../src/application/recipe/ListRecipesUseCase.js';

const recipeRecord = {
  id: 'recipe-uuid-1',
  title: 'خورشت قورمه سبزی',
  description: 'غذای سنتی',
  ingredients: [{ name: 'سبزی', amount: '500g' }],
  instructions: ['مرحله 1'],
  category: 'خورشت',
  prepTime: 30,
  cookTime: 120,
  servings: 4,
  calories: 450,
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
};

function makeUseCase({ searchResult = { items: [recipeRecord], total: 1 } } = {}) {
  const recipeRepository = {
    search: jest.fn().mockResolvedValue(searchResult),
  };

  const useCase = new ListRecipesUseCase(recipeRepository);

  return { useCase, recipeRepository };
}

describe('ListRecipesUseCase', () => {
  it('returns paginated recipes with defaults', async () => {
    const { useCase, recipeRepository } = makeUseCase();

    const result = await useCase.execute({});

    expect(recipeRepository.search).toHaveBeenCalledWith({
      q: undefined,
      category: undefined,
      page: 1,
      limit: 20,
    });
    expect(result).toEqual({
      items: [
        {
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
          createdAt: recipeRecord.createdAt,
          updatedAt: recipeRecord.updatedAt,
        },
      ],
      pagination: {
        page: 1,
        limit: 20,
        total: 1,
        totalPages: 1,
      },
    });
  });

  it('passes search filters to the repository', async () => {
    const { useCase, recipeRepository } = makeUseCase({ searchResult: { items: [], total: 0 } });

    await useCase.execute({ q: 'سبزی', category: 'خورشت', page: 2, limit: 10 });

    expect(recipeRepository.search).toHaveBeenCalledWith({
      q: 'سبزی',
      category: 'خورشت',
      page: 2,
      limit: 10,
    });
  });

  it.each([0, -1, 1.5])('throws ValidationError for invalid page: %p', async (page) => {
    const { useCase, recipeRepository } = makeUseCase();

    await expect(useCase.execute({ page })).rejects.toThrow(ValidationError);
    expect(recipeRepository.search).not.toHaveBeenCalled();
  });

  it.each([0, -1, 101, 1.5])('throws ValidationError for invalid limit: %p', async (limit) => {
    const { useCase, recipeRepository } = makeUseCase();

    await expect(useCase.execute({ limit })).rejects.toThrow(ValidationError);
    expect(recipeRepository.search).not.toHaveBeenCalled();
  });

  it('throws ValidationError when q is not a string', async () => {
    const { useCase, recipeRepository } = makeUseCase();

    await expect(useCase.execute({ q: 123 })).rejects.toThrow(ValidationError);
    expect(recipeRepository.search).not.toHaveBeenCalled();
  });

  it('throws ValidationError when category is not a string', async () => {
    const { useCase, recipeRepository } = makeUseCase();

    await expect(useCase.execute({ category: 123 })).rejects.toThrow(ValidationError);
    expect(recipeRepository.search).not.toHaveBeenCalled();
  });
});
