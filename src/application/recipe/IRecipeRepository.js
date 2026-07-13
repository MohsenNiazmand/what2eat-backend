export class IRecipeRepository {
  /**
   * @param {object} recipe
   * @returns {Promise<object>} persisted recipe with id
   */
  // eslint-disable-next-line no-unused-vars
  async create(recipe) {
    throw new Error('IRecipeRepository.create() must be implemented');
  }

  /**
   * @param {string} id
   * @returns {Promise<object|null>}
   */
  // eslint-disable-next-line no-unused-vars
  async findById(id) {
    throw new Error('IRecipeRepository.findById() must be implemented');
  }

  /**
   * @param {{ q?: string, category?: string, page: number, limit: number }} params
   * @returns {Promise<{ items: object[], total: number }>}
   */
  // eslint-disable-next-line no-unused-vars
  async search(params) {
    throw new Error('IRecipeRepository.search() must be implemented');
  }
}
