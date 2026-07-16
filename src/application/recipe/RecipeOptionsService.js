import { COUNTRIES, DIETARY_PREFERENCES } from './recipeOptionsConfig.js';

export class RecipeOptionsService {
  getOptionsForUser(_user = null) {
    const isPro = this._isProUser(_user);

    return {
      countries: COUNTRIES.map((item) => ({
        id: item.id,
        label: item.label,
        isAvailable: isPro || item.freeTier !== false,
      })),
      dietaryPreferences: DIETARY_PREFERENCES.map((item) => ({
        id: item.id,
        label: item.label,
        isAvailable: isPro || item.freeTier !== false,
      })),
    };
  }

  getCountryById(id) {
    return COUNTRIES.find((item) => item.id === id) ?? null;
  }

  getDietaryPreferenceById(id) {
    return DIETARY_PREFERENCES.find((item) => item.id === id) ?? null;
  }

  isCountryAvailable(id, user = null) {
    const country = this.getCountryById(id);
    if (!country) {
      return false;
    }

    return this._isProUser(user) || country.freeTier !== false;
  }

  isDietaryPreferenceAvailable(id, user = null) {
    const preference = this.getDietaryPreferenceById(id);
    if (!preference) {
      return false;
    }

    return this._isProUser(user) || preference.freeTier !== false;
  }

  _isProUser(_user) {
    return false;
  }
}
