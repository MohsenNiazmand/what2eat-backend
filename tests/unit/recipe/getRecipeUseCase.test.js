import { jest } from '@jest/globals';
import { ValidationError, NotFoundError } from '../../../src/domain/errors/AppError.js';
import { GetRecipeUseCase } from '../../../src/application/recipe/GetRecipeUseCase.js';

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

function makeUseCase({ findResult = recipeRecord } = {}) {
  const recipeRepository = {
    findById: jest.fn().mockResolvedValue(findResult),
  };

  const useCase = new GetRecipeUseCase(recipeRepository);

  return { useCase, recipeRepository };
}

describe('GetRecipeUseCase', () => {
  it('returns the recipe when it exists', async () => {
    const { useCase, recipeRepository } = makeUseCase();

    const result = await useCase.execute('recipe-uuid-1');

    expect(recipeRepository.findById).toHaveBeenCalledWith('recipe-uuid-1');
    expect(result).toEqual({
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
    });
  });

  it('throws NotFoundError when the recipe does not exist', async () => {
    const { useCase } = makeUseCase({ findResult: null });

    await expect(useCase.execute('missing-id')).rejects.toThrow(NotFoundError);
    await expect(useCase.execute('missing-id')).rejects.toThrow('Recipe not found');
  });

  it.each([undefined, '', '   '])('throws ValidationError when id is invalid: %p', async (id) => {
    const { useCase, recipeRepository } = makeUseCase();

    await expect(useCase.execute(id)).rejects.toThrow(ValidationError);
    expect(recipeRepository.findById).not.toHaveBeenCalled();
  });
});
