export class IFavoriteRepository {
  /**
   * @param {string} userId
   * @param {string} recipeId
   * @returns {Promise<object|null>}
   */
  // eslint-disable-next-line no-unused-vars
  async findByUserAndRecipe(userId, recipeId) {
    throw new Error('IFavoriteRepository.findByUserAndRecipe() must be implemented');
  }

  /**
   * @param {string} userId
   * @param {string} recipeId
   * @returns {Promise<object>}
   */
  // eslint-disable-next-line no-unused-vars
  async create(userId, recipeId) {
    throw new Error('IFavoriteRepository.create() must be implemented');
  }

  /**
   * @param {string} userId
   * @param {string} recipeId
   * @returns {Promise<object>}
   */
  // eslint-disable-next-line no-unused-vars
  async deleteByUserAndRecipe(userId, recipeId) {
    throw new Error('IFavoriteRepository.deleteByUserAndRecipe() must be implemented');
  }

  /**
   * @param {string} userId
   * @returns {Promise<object[]>}
   */
  // eslint-disable-next-line no-unused-vars
  async listByUserId(userId) {
    throw new Error('IFavoriteRepository.listByUserId() must be implemented');
  }
}
