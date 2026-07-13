import { jest } from '@jest/globals';
import { ValidationError, ExternalServiceError } from '../../../src/domain/errors/AppError.js';
import { GenerateRecipeUseCase } from '../../../src/application/recipe/GenerateRecipeUseCase.js';

const validGeneratedRecipe = {
  title: 'غذای تست',
  description: 'توضیح',
  ingredients: [{ name: 'گوجه', amount: '2 عدد' }],
  instructions: ['مرحله 1'],
  calories: 300,
  prepTime: 10,
  cookTime: 20,
  servings: 2,
  category: 'پاستا',
};

const savedRecipe = {
  id: 'recipe-uuid-1',
  ...validGeneratedRecipe,
  createdAt: new Date(),
  updatedAt: new Date(),
};

function makeUseCase({ generatedRecipe = validGeneratedRecipe, generatorError = null } = {}) {
  const promptBuilder = {
    build: jest.fn().mockReturnValue({ system: 'sys', user: 'usr' }),
  };
  const recipeGenerator = {
    generate: generatorError
      ? jest.fn().mockRejectedValue(generatorError)
      : jest.fn().mockResolvedValue(generatedRecipe),
  };
  const recipeRepository = {
    create: jest.fn().mockResolvedValue(savedRecipe),
  };

  const useCase = new GenerateRecipeUseCase(promptBuilder, recipeGenerator, recipeRepository);

  return { useCase, promptBuilder, recipeGenerator, recipeRepository };
}

describe('GenerateRecipeUseCase', () => {
  it('builds a prompt, generates a recipe, persists it, and returns the saved recipe with id', async () => {
    const { useCase, promptBuilder, recipeGenerator, recipeRepository } = makeUseCase();
    const input = { ingredients: ['گوجه', 'پونه'], tools: ['تابه'], calorieLimit: 400, servings: 2 };

    const result = await useCase.execute(input);

    expect(promptBuilder.build).toHaveBeenCalledWith(input);
    expect(recipeGenerator.generate).toHaveBeenCalledWith({ system: 'sys', user: 'usr' });
    expect(recipeRepository.create).toHaveBeenCalledWith(validGeneratedRecipe);
    expect(result).toEqual(savedRecipe);
    expect(result.id).toBe('recipe-uuid-1');
  });

  it.each([
    [undefined, 'ingredients is required and must be a non-empty array'],
    [[], 'ingredients is required and must be a non-empty array'],
    [['گوجه', 123], 'ingredients must contain only strings'],
    ['not-an-array', 'ingredients is required and must be a non-empty array'],
  ])('throws ValidationError for invalid ingredients: %p', async (ingredients, message) => {
    const { useCase } = makeUseCase();

    await expect(useCase.execute({ ingredients })).rejects.toThrow(ValidationError);
    await expect(useCase.execute({ ingredients })).rejects.toThrow(message);
  });

  it('throws ValidationError when tools is provided but not an array of strings', async () => {
    const { useCase } = makeUseCase();

    await expect(useCase.execute({ ingredients: ['گوجه'], tools: 'تابه' })).rejects.toThrow(ValidationError);
    await expect(useCase.execute({ ingredients: ['گوجه'], tools: ['تابه', 1] })).rejects.toThrow(ValidationError);
  });

  it.each([0, -100, '400'])(
    'throws ValidationError when calorieLimit is invalid: %p',
    async (calorieLimit) => {
      const { useCase } = makeUseCase();

      await expect(useCase.execute({ ingredients: ['گوجه'], calorieLimit })).rejects.toThrow(ValidationError);
    }
  );

  it.each([0, -1, 1.5, '2'])(
    'throws ValidationError when servings is invalid: %p',
    async (servings) => {
      const { useCase } = makeUseCase();

      await expect(useCase.execute({ ingredients: ['گوجه'], servings })).rejects.toThrow(ValidationError);
    }
  );

  it('propagates ExternalServiceError from the generator without persisting', async () => {
    const error = new ExternalServiceError('Failed to reach DeepSeek API');
    const { useCase, recipeRepository } = makeUseCase({ generatorError: error });

    await expect(useCase.execute({ ingredients: ['گوجه'] })).rejects.toThrow(ExternalServiceError);
    expect(recipeRepository.create).not.toHaveBeenCalled();
  });
});
