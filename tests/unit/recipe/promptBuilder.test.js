import { ValidationError } from '../../../src/domain/errors/AppError.js';
import { PromptBuilder } from '../../../src/application/recipe/PromptBuilder.js';

describe('PromptBuilder', () => {
  let builder;

  beforeEach(() => {
    builder = new PromptBuilder();
  });

  it('returns an object with system and user string properties', () => {
    const result = builder.build({ ingredients: ['گوجه', 'پونه'] });

    expect(result).toEqual({
      system: expect.any(String),
      user: expect.any(String),
    });
  });

  it.each([undefined, [], 'not-an-array'])('throws ValidationError for invalid ingredients: %p', (ingredients) => {
    expect(() => builder.build({ ingredients })).toThrow(ValidationError);
    expect(() => builder.build({ ingredients })).toThrow('ingredients is required and must be a non-empty array');
  });

  it('includes each provided ingredient in the user prompt', () => {
    const result = builder.build({ ingredients: ['گوجه', 'پونه'] });

    expect(result.user).toContain('گوجه');
    expect(result.user).toContain('پونه');
  });

  it('includes each tool in the user prompt when tools are provided', () => {
    const result = builder.build({ ingredients: ['گوجه'], tools: ['تابه', 'ماکروفر'] });

    expect(result.user).toContain('تابه');
    expect(result.user).toContain('ماکروفر');
  });

  it('includes the calorie constraint when provided and omits it otherwise', () => {
    const withCalories = builder.build({ ingredients: ['گوجه'], calorieLimit: 400 });
    const withoutCalories = builder.build({ ingredients: ['گوجه'] });

    expect(withCalories.user).toContain('400');
    expect(withoutCalories.user).not.toContain('کالری');
  });

  it('contains the JSON keyword and all required schema keys in the system prompt', () => {
    const result = builder.build({ ingredients: ['گوجه'] });

    expect(result.system).toContain('JSON');
    expect(result.system).toContain('title');
    expect(result.system).toContain('ingredients');
    expect(result.system).toContain('instructions');
    expect(result.system).toContain('calories');
    expect(result.system).toContain('prepTime');
    expect(result.system).toContain('cookTime');
    expect(result.system).toContain('servings');
    expect(result.system).toContain('category');
  });

  it('contains Persian text in the system prompt', () => {
    const result = builder.build({ ingredients: ['گوجه'] });

    expect(result.system).toContain('مواد');
  });
});
