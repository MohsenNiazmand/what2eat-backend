import { RecipeOptionsService } from '../../../src/application/recipe/RecipeOptionsService.js';

describe('RecipeOptionsService', () => {
  let service;

  beforeEach(() => {
    service = new RecipeOptionsService();
  });

  it('returns countries and dietaryPreferences with id, label, and isAvailable', () => {
    const options = service.getOptionsForUser();

    expect(options.countries.length).toBeGreaterThan(0);
    expect(options.dietaryPreferences.length).toBeGreaterThan(0);

    for (const country of options.countries) {
      expect(country).toEqual({
        id: expect.any(String),
        label: expect.any(String),
        isAvailable: expect.any(Boolean),
      });
    }

    for (const preference of options.dietaryPreferences) {
      expect(preference).toEqual({
        id: expect.any(String),
        label: expect.any(String),
        isAvailable: expect.any(Boolean),
      });
    }
  });

  it('marks free-tier options as available for non-pro users', () => {
    const options = service.getOptionsForUser();

    const iran = options.countries.find((item) => item.id === 'iran');
    const vegan = options.dietaryPreferences.find((item) => item.id === 'vegan');

    expect(iran.isAvailable).toBe(true);
    expect(vegan.isAvailable).toBe(true);
  });

  it('marks pro-only options as unavailable for non-pro users', () => {
    const options = service.getOptionsForUser();

    const japan = options.countries.find((item) => item.id === 'japan');
    const keto = options.dietaryPreferences.find((item) => item.id === 'keto');

    expect(japan.isAvailable).toBe(false);
    expect(keto.isAvailable).toBe(false);
  });

  it('resolves known country and dietary ids', () => {
    expect(service.getCountryById('iran')).toEqual(expect.objectContaining({ label: 'ایران' }));
    expect(service.getDietaryPreferenceById('vegan')).toEqual(expect.objectContaining({ label: 'وگان' }));
    expect(service.getCountryById('unknown')).toBeNull();
  });
});
