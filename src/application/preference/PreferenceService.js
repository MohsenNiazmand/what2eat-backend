import { ValidationError, NotFoundError } from '../../domain/errors/AppError.js';

export class PreferenceService {
  constructor(preferenceRepository) {
    this.preferenceRepository = preferenceRepository;
  }

  async getPreference(userId) {
    const preference = await this.preferenceRepository.findByUserId(userId);

    if (!preference) {
      throw new NotFoundError('Preferences not found');
    }

    return this._toResponse(preference);
  }

  async upsertPreference(userId, input) {
    this._validate(input);

    const preference = await this.preferenceRepository.upsert(userId, {
      dietaryRestrictions: input.dietaryRestrictions,
      preferredCuisines: input.preferredCuisines,
    });

    return this._toResponse(preference);
  }

  async deletePreference(userId) {
    const preference = await this.preferenceRepository.findByUserId(userId);

    if (!preference) {
      throw new NotFoundError('Preferences not found');
    }

    await this.preferenceRepository.deleteByUserId(userId);

    return { success: true, message: 'Preferences deleted successfully' };
  }

  _validate(input) {
    const { dietaryRestrictions, preferredCuisines } = input ?? {};

    if (!Array.isArray(dietaryRestrictions)) {
      throw new ValidationError('dietaryRestrictions is required and must be an array');
    }

    if (!dietaryRestrictions.every((item) => typeof item === 'string')) {
      throw new ValidationError('dietaryRestrictions must contain only strings');
    }

    if (!Array.isArray(preferredCuisines)) {
      throw new ValidationError('preferredCuisines is required and must be an array');
    }

    if (!preferredCuisines.every((item) => typeof item === 'string')) {
      throw new ValidationError('preferredCuisines must contain only strings');
    }
  }

  _toResponse(preference) {
    return {
      id: preference.id,
      dietaryRestrictions: preference.dietaryRestrictions,
      preferredCuisines: preference.preferredCuisines,
      updatedAt: preference.updatedAt,
    };
  }
}
