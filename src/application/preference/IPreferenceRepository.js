export class IPreferenceRepository {
  /**
   * @param {string} userId
   * @returns {Promise<object|null>}
   */
  // eslint-disable-next-line no-unused-vars
  async findByUserId(userId) {
    throw new Error('IPreferenceRepository.findByUserId() must be implemented');
  }

  /**
   * @param {string} userId
   * @param {{ dietaryRestrictions: string[], preferredCuisines: string[] }} data
   * @returns {Promise<object>}
   */
  // eslint-disable-next-line no-unused-vars
  async upsert(userId, data) {
    throw new Error('IPreferenceRepository.upsert() must be implemented');
  }

  /**
   * @param {string} userId
   * @returns {Promise<object>}
   */
  // eslint-disable-next-line no-unused-vars
  async deleteByUserId(userId) {
    throw new Error('IPreferenceRepository.deleteByUserId() must be implemented');
  }
}
