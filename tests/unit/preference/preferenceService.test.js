import { jest } from '@jest/globals';
import { ValidationError, NotFoundError } from '../../../src/domain/errors/AppError.js';
import { PreferenceService } from '../../../src/application/preference/PreferenceService.js';

const preferenceRecord = {
  id: 'pref-uuid-1',
  userId: 'user-uuid-1',
  dietaryRestrictions: ['Vegan'],
  preferredCuisines: ['Persian'],
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
};

function makeService({ findResult = null, upsertResult = preferenceRecord, deleteResult = preferenceRecord } = {}) {
  const preferenceRepository = {
    findByUserId: jest.fn().mockResolvedValue(findResult),
    upsert: jest.fn().mockResolvedValue(upsertResult),
    deleteByUserId: jest.fn().mockResolvedValue(deleteResult),
  };

  const service = new PreferenceService(preferenceRepository);

  return { service, preferenceRepository };
}

describe('PreferenceService', () => {
  describe('getPreference', () => {
    it('returns the preference for the authenticated user', async () => {
      const { service, preferenceRepository } = makeService({ findResult: preferenceRecord });

      const result = await service.getPreference('user-uuid-1');

      expect(preferenceRepository.findByUserId).toHaveBeenCalledWith('user-uuid-1');
      expect(result).toEqual({
        id: preferenceRecord.id,
        dietaryRestrictions: preferenceRecord.dietaryRestrictions,
        preferredCuisines: preferenceRecord.preferredCuisines,
        updatedAt: preferenceRecord.updatedAt,
      });
    });

    it('throws NotFoundError when no preference exists', async () => {
      const { service } = makeService({ findResult: null });

      await expect(service.getPreference('user-uuid-1')).rejects.toThrow(NotFoundError);
      await expect(service.getPreference('user-uuid-1')).rejects.toThrow('Preferences not found');
    });
  });

  describe('upsertPreference', () => {
    it('creates or updates preferences for the authenticated user', async () => {
      const { service, preferenceRepository } = makeService();
      const input = {
        dietaryRestrictions: ['Gluten-free'],
        preferredCuisines: ['Italian'],
      };

      const result = await service.upsertPreference('user-uuid-1', input);

      expect(preferenceRepository.upsert).toHaveBeenCalledWith('user-uuid-1', input);
      expect(result).toEqual({
        id: preferenceRecord.id,
        dietaryRestrictions: preferenceRecord.dietaryRestrictions,
        preferredCuisines: preferenceRecord.preferredCuisines,
        updatedAt: preferenceRecord.updatedAt,
      });
    });

    it.each([
      [undefined, 'dietaryRestrictions is required and must be an array'],
      ['not-an-array', 'dietaryRestrictions is required and must be an array'],
      [['Vegan', 1], 'dietaryRestrictions must contain only strings'],
    ])('throws ValidationError for invalid dietaryRestrictions: %p', async (dietaryRestrictions, message) => {
      const { service, preferenceRepository } = makeService();

      await expect(
        service.upsertPreference('user-uuid-1', {
          dietaryRestrictions,
          preferredCuisines: [],
        })
      ).rejects.toThrow(ValidationError);
      await expect(
        service.upsertPreference('user-uuid-1', {
          dietaryRestrictions,
          preferredCuisines: [],
        })
      ).rejects.toThrow(message);
      expect(preferenceRepository.upsert).not.toHaveBeenCalled();
    });

    it.each([
      [undefined, 'preferredCuisines is required and must be an array'],
      ['not-an-array', 'preferredCuisines is required and must be an array'],
      [['Persian', 1], 'preferredCuisines must contain only strings'],
    ])('throws ValidationError for invalid preferredCuisines: %p', async (preferredCuisines, message) => {
      const { service, preferenceRepository } = makeService();

      await expect(
        service.upsertPreference('user-uuid-1', {
          dietaryRestrictions: [],
          preferredCuisines,
        })
      ).rejects.toThrow(ValidationError);
      await expect(
        service.upsertPreference('user-uuid-1', {
          dietaryRestrictions: [],
          preferredCuisines,
        })
      ).rejects.toThrow(message);
      expect(preferenceRepository.upsert).not.toHaveBeenCalled();
    });
  });

  describe('deletePreference', () => {
    it('deletes preferences for the authenticated user', async () => {
      const { service, preferenceRepository } = makeService({ findResult: preferenceRecord });

      const result = await service.deletePreference('user-uuid-1');

      expect(preferenceRepository.deleteByUserId).toHaveBeenCalledWith('user-uuid-1');
      expect(result).toEqual({ success: true, message: 'Preferences deleted successfully' });
    });

    it('throws NotFoundError when no preference exists', async () => {
      const { service, preferenceRepository } = makeService({ findResult: null });

      await expect(service.deletePreference('user-uuid-1')).rejects.toThrow(NotFoundError);
      expect(preferenceRepository.deleteByUserId).not.toHaveBeenCalled();
    });
  });
});
