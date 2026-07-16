import { ValidationError } from '../../domain/errors/AppError.js';
import { IngredientGuard } from './IngredientGuard.js';
import { RecipeOptionsService } from './RecipeOptionsService.js';
import { NOTES_MAX_LENGTH } from './recipeOptionsConfig.js';

export class GenerateRecipeUseCase {
  constructor(
    promptBuilder,
    recipeGenerator,
    recipeRepository,
    ingredientGuard = new IngredientGuard(),
    recipeOptionsService = new RecipeOptionsService()
  ) {
    this.promptBuilder = promptBuilder;
    this.recipeGenerator = recipeGenerator;
    this.recipeRepository = recipeRepository;
    this.ingredientGuard = ingredientGuard;
    this.recipeOptionsService = recipeOptionsService;
  }

  async execute(input, context = {}) {
    const normalized = this._validate(input, context.user ?? null);
    this.ingredientGuard.validateRecipeInput(normalized);

    const prompt = this.promptBuilder.build(normalized);
    const generated = await this.recipeGenerator.generate(prompt);
    const saved = await this.recipeRepository.create(generated);

    return saved;
  }

  _validate(input, user) {
    const {
      ingredients = [],
      tools = [],
      countries = [],
      dietaryPreferences = [],
      exclusions = [],
      notes,
      calorieLimit,
      servings,
    } = input ?? {};

    this._validateStringArray(ingredients, 'ingredients');
    this._validateStringArray(tools, 'tools');
    this._validateStringArray(countries, 'countries');
    this._validateStringArray(dietaryPreferences, 'dietaryPreferences');
    this._validateStringArray(exclusions, 'exclusions');

    if (notes !== undefined && typeof notes !== 'string') {
      throw new ValidationError('notes must be a string');
    }

    const trimmedNotes = typeof notes === 'string' ? notes.trim() : '';

    if (trimmedNotes.length > NOTES_MAX_LENGTH) {
      throw new ValidationError(`notes must be at most ${NOTES_MAX_LENGTH} characters`);
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

    this._validateOptionIds(countries, 'countries', user);
    this._validateOptionIds(dietaryPreferences, 'dietaryPreferences', user);

    if (!this._hasAtLeastOneConstraint({
      countries,
      dietaryPreferences,
      ingredients,
      calorieLimit,
      servings,
      notes: trimmedNotes,
    })) {
      throw new ValidationError(
        'حداقل یکی از این فیلدها باید مشخص شود: countries، dietaryPreferences، ingredients، calorieLimit، servings، notes'
      );
    }

    return {
      ingredients,
      tools,
      countries,
      dietaryPreferences,
      exclusions,
      notes: trimmedNotes || undefined,
      calorieLimit,
      servings,
    };
  }

  _validateStringArray(value, fieldName) {
    if (!Array.isArray(value)) {
      throw new ValidationError(`${fieldName} must be an array of strings`);
    }

    if (!value.every((item) => typeof item === 'string')) {
      throw new ValidationError(`${fieldName} must contain only strings`);
    }
  }

  _validateOptionIds(ids, kind, user) {
    for (const id of ids) {
      if (kind === 'countries') {
        const country = this.recipeOptionsService.getCountryById(id);
        if (!country) {
          throw new ValidationError(`کشور نامعتبر: ${id}`);
        }

        if (!this.recipeOptionsService.isCountryAvailable(id, user)) {
          throw new ValidationError(`کشور «${country.label}» در نسخه فعلی در دسترس نیست`);
        }
      }

      if (kind === 'dietaryPreferences') {
        const preference = this.recipeOptionsService.getDietaryPreferenceById(id);
        if (!preference) {
          throw new ValidationError(`ترجیح غذایی نامعتبر: ${id}`);
        }

        if (!this.recipeOptionsService.isDietaryPreferenceAvailable(id, user)) {
          throw new ValidationError(`ترجیح «${preference.label}» در نسخه فعلی در دسترس نیست`);
        }
      }
    }
  }

  _hasAtLeastOneConstraint({ countries, dietaryPreferences, ingredients, calorieLimit, servings, notes }) {
    if (countries.length > 0) {
      return true;
    }

    if (dietaryPreferences.length > 0) {
      return true;
    }

    if (ingredients.length > 0) {
      return true;
    }

    if (typeof calorieLimit === 'number' && calorieLimit > 0) {
      return true;
    }

    if (typeof servings === 'number' && servings > 0) {
      return true;
    }

    if (typeof notes === 'string' && notes.length > 0) {
      return true;
    }

    return false;
  }
}
