import { PreferenceRepository } from '../../../infrastructure/database/PreferenceRepository.js';
import { PreferenceService } from '../../../application/preference/PreferenceService.js';

const preferenceService = new PreferenceService(new PreferenceRepository());

export async function getPreference(req, res, next) {
  try {
    const result = await preferenceService.getPreference(req.user.id);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

export async function upsertPreference(req, res, next) {
  try {
    const result = await preferenceService.upsertPreference(req.user.id, req.body);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

export async function deletePreference(req, res, next) {
  try {
    const result = await preferenceService.deletePreference(req.user.id);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}
