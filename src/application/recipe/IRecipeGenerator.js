export class IRecipeGenerator {
  /**
   * @param {{ system: string, user: string }} prompt
   * @returns {Promise<object>} a recipe object matching the RECIPE JSON schema
   */
  // eslint-disable-next-line no-unused-vars
  async generate(prompt) {
    throw new Error('IRecipeGenerator.generate() must be implemented');
  }
}
