import { jest } from '@jest/globals';
import {
  ValidationError,
  ExternalServiceError,
  ContentModerationError,
  NonPersianTextError,
} from '../../../src/domain/errors/AppError.js';
import { GenerateRecipeUseCase } from '../../../src/application/recipe/GenerateRecipeUseCase.js';
import { RecipeOptionsService } from '../../../src/application/recipe/RecipeOptionsService.js';

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

  const useCase = new GenerateRecipeUseCase(
    promptBuilder,
    recipeGenerator,
    recipeRepository,
    undefined,
    new RecipeOptionsService()
  );

  return { useCase, promptBuilder, recipeGenerator, recipeRepository };
}

describe('GenerateRecipeUseCase', () => {
  it('builds a prompt, generates a recipe, persists it, and returns the saved recipe with id', async () => {
    const { useCase, promptBuilder, recipeGenerator, recipeRepository } = makeUseCase();
    const input = {
      ingredients: ['گوجه', 'پونه'],
      tools: ['تابه'],
      calorieLimit: 400,
      servings: 2,
      countries: ['iran'],
      dietaryPreferences: ['vegan'],
      exclusions: ['چلو مرغ'],
      notes: 'غذای سبک',
    };

    const result = await useCase.execute(input);

    expect(promptBuilder.build).toHaveBeenCalledWith(
      expect.objectContaining({
        ingredients: ['گوجه', 'پونه'],
        tools: ['تابه'],
        calorieLimit: 400,
        servings: 2,
        countries: ['iran'],
        dietaryPreferences: ['vegan'],
        exclusions: ['چلو مرغ'],
        notes: 'غذای سبک',
      })
    );
    expect(recipeGenerator.generate).toHaveBeenCalledWith({ system: 'sys', user: 'usr' });
    expect(recipeRepository.create).toHaveBeenCalledWith(validGeneratedRecipe);
    expect(result).toEqual(savedRecipe);
  });

  it.each([
    [{ dietaryPreferences: ['vegan'] }],
    [{ countries: ['iran'] }],
    [{ calorieLimit: 600 }],
    [{ servings: 2 }],
    [{ notes: 'غذای سبک با مرغ' }],
    [{ ingredients: ['گوجه'] }],
  ])('accepts request when at least one constraint is provided: %p', async (input) => {
    const { useCase, recipeGenerator } = makeUseCase();

    await expect(useCase.execute(input)).resolves.toEqual(savedRecipe);
    expect(recipeGenerator.generate).toHaveBeenCalled();
  });

  it('throws ValidationError when no constraint is provided', async () => {
    const { useCase } = makeUseCase();

    await expect(useCase.execute({})).rejects.toThrow(ValidationError);
    await expect(useCase.execute({ ingredients: [], exclusions: ['چلو مرغ'] })).rejects.toThrow(
      ValidationError
    );
  });

  it.each([
    [['گوجه', 123], 'ingredients must contain only strings'],
    ['not-an-array', 'ingredients must be an array of strings'],
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

  it.each([0, -100, '400'])('throws ValidationError when calorieLimit is invalid: %p', async (calorieLimit) => {
    const { useCase } = makeUseCase();

    await expect(useCase.execute({ calorieLimit })).rejects.toThrow(ValidationError);
  });

  it.each([0, -1, 1.5, '2'])('throws ValidationError when servings is invalid: %p', async (servings) => {
    const { useCase } = makeUseCase();

    await expect(useCase.execute({ servings })).rejects.toThrow(ValidationError);
  });

  it('throws ValidationError for unknown country or unavailable pro-only country', async () => {
    const { useCase } = makeUseCase();

    await expect(useCase.execute({ countries: ['atlantis'] })).rejects.toThrow('کشور نامعتبر');
    await expect(useCase.execute({ countries: ['japan'] })).rejects.toThrow('در نسخه فعلی در دسترس نیست');
  });

  it('throws ValidationError for unknown dietary preference', async () => {
    const { useCase } = makeUseCase();

    await expect(useCase.execute({ dietaryPreferences: ['paleo'] })).rejects.toThrow(
      'ترجیح غذایی نامعتبر'
    );
  });

  it('propagates ExternalServiceError from the generator without persisting', async () => {
    const error = new ExternalServiceError('Failed to reach DeepSeek API');
    const { useCase, recipeRepository } = makeUseCase({ generatorError: error });

    await expect(useCase.execute({ ingredients: ['گوجه'] })).rejects.toThrow(ExternalServiceError);
    expect(recipeRepository.create).not.toHaveBeenCalled();
  });

  it('rejects forbidden ingredients before calling the generator', async () => {
    const { useCase, promptBuilder, recipeGenerator, recipeRepository } = makeUseCase();

    await expect(useCase.execute({ ingredients: ['مدفوع', 'پیاز'] })).rejects.toThrow(
      ContentModerationError
    );

    expect(promptBuilder.build).not.toHaveBeenCalled();
    expect(recipeGenerator.generate).not.toHaveBeenCalled();
    expect(recipeRepository.create).not.toHaveBeenCalled();
  });

  it('rejects non-Persian text before calling the generator', async () => {
    const { useCase, promptBuilder, recipeGenerator, recipeRepository } = makeUseCase();

    await expect(useCase.execute({ ingredients: ['tomato'] })).rejects.toThrow(NonPersianTextError);

    expect(promptBuilder.build).not.toHaveBeenCalled();
    expect(recipeGenerator.generate).not.toHaveBeenCalled();
    expect(recipeRepository.create).not.toHaveBeenCalled();
  });
});
