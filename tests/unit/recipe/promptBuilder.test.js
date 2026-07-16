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

  it('throws ValidationError when no constraint is provided', () => {
    expect(() => builder.build({})).toThrow(ValidationError);
    expect(() => builder.build({ ingredients: [] })).toThrow(ValidationError);
  });

  it('builds a calorie-only prompt without requiring ingredients', () => {
    const result = builder.build({ calorieLimit: 600, servings: 1 });

    expect(result.user).toContain('600');
    expect(result.user).toContain('1');
    expect(result.system).toContain('مواد را خودت انتخاب کن');
    expect(result.user).not.toContain('مواد موجود');
  });

  it('builds a country-only prompt', () => {
    const result = builder.build({ countries: ['iran'] });

    expect(result.user).toContain('ایران');
    expect(result.system).toContain('فرهنگ و سنت کشور');
  });

  it('builds a dietary-preference-only prompt', () => {
    const result = builder.build({ dietaryPreferences: ['vegan'] });

    expect(result.user).toContain('وگان');
  });

  it('includes each provided ingredient in pantry mode', () => {
    const result = builder.build({ ingredients: ['گوجه', 'پونه'] });

    expect(result.user).toContain('گوجه');
    expect(result.user).toContain('پونه');
    expect(result.user).toContain('مواد موجود');
    expect(result.system).toContain('مواد کاربر');
  });

  it('includes tools, exclusions, and notes when provided', () => {
    const result = builder.build({
      ingredients: ['مرغ'],
      tools: ['تابه'],
      exclusions: ['چلو مرغ', 'سالاد الویه'],
      notes: 'غذای اصلی و تند نباشد',
    });

    expect(result.user).toContain('تابه');
    expect(result.user).toContain('چلو مرغ');
    expect(result.user).toContain('سالاد الویه');
    expect(result.user).toContain('غذای اصلی و تند نباشد');
    expect(result.system).toContain('استثنا');
  });

  it('allows global cuisine when no country is selected', () => {
    const result = builder.build({ dietaryPreferences: ['vegan'] });

    expect(result.user).toContain('همه آشپزی‌های جهانی مجاز است');
  });

  it('instructs authentic dishes first and allows invention when needed', () => {
    const result = builder.build({ countries: ['italy'] });

    expect(result.system).toContain('واقعی و شناخته‌شده');
    expect(result.system).toContain('دستور جدید');
    expect(result.system).not.toContain('حتماً نام سنتی ایرانی');
  });

  it('contains the JSON schema keys in the system prompt', () => {
    const result = builder.build({ notes: 'غذای سبک' });

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
});
