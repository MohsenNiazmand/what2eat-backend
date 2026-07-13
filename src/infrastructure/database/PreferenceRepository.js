import { IPreferenceRepository } from '../../application/preference/IPreferenceRepository.js';
import prisma from './prisma.js';

export class PreferenceRepository extends IPreferenceRepository {
  async findByUserId(userId) {
    return prisma.preference.findUnique({ where: { userId } });
  }

  async upsert(userId, { dietaryRestrictions, preferredCuisines }) {
    return prisma.preference.upsert({
      where: { userId },
      create: { userId, dietaryRestrictions, preferredCuisines },
      update: { dietaryRestrictions, preferredCuisines },
    });
  }

  async deleteByUserId(userId) {
    return prisma.preference.delete({ where: { userId } });
  }
}
