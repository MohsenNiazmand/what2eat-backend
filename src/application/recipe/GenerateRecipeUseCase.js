import { ValidationError } from '../../domain/errors/AppError.js';
import { IngredientGuard } from './IngredientGuard.js';

export class GenerateRecipeUseCase {
  constructor(promptBuilder, recipeGenerator, recipeRepository, ingredientGuard = new IngredientGuard()) {
    this.promptBuilder = promptBuilder;
    this.recipeGenerator = recipeGenerator;
    this.recipeRepository = recipeRepository;
    this.ingredientGuard = ingredientGuard;
  }

  async execute(input) {
    this._validate(input);
    this.ingredientGuard.validate({
      ingredients: input.ingredients,
      tools: input.tools ?? [],
    });

    const prompt = this.promptBuilder.build(input);
    const generated = await this.recipeGenerator.generate(prompt);
    const saved = await this.recipeRepository.create(generated);

    return saved;
  }

  _validate(input) {
    const { ingredients, tools, calorieLimit, servings } = input ?? {};

    if (!Array.isArray(ingredients) || ingredients.length === 0) {
      throw new ValidationError('ingredients is required and must be a non-empty array');
    }

    if (!ingredients.every((item) => typeof item === 'string')) {
      throw new ValidationError('ingredients must contain only strings');
    }

    if (tools !== undefined) {
      if (!Array.isArray(tools) || !tools.every((item) => typeof item === 'string')) {
        throw new ValidationError('tools must be an array of strings');
      }
    }

    if (calorieLimit !== undefined) {
      if (typeof calorieLimit !== 'number' || calorieLimit <= 0) {
        throw new ValidationError('calorieLimit must be a positive number');
      }
    }

    if (servings !== undefined) {
      if (!Number.isInteger(servings) || servings <= 0) {
        throw new ValidationError('servings must be a positive integer');
      }
    }
  }
}
