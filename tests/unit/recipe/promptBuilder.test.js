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
    expect(result.user).toContain('فقط با این ابزارها');
  });

  it('includes the calorie constraint when provided and omits it otherwise', () => {
    const withCalories = builder.build({ ingredients: ['گوجه'], calorieLimit: 400 });
    const withoutCalories = builder.build({ ingredients: ['گوجه'] });

    expect(withCalories.user).toContain('400');
    expect(withCalories.user).toContain('سقف کالری کل غذا');
    expect(withCalories.user).toContain('همه‌ی پرس‌ها');
    expect(withoutCalories.user).not.toContain('کالری');
  });

  it('instructs using Persian digits in the system prompt', () => {
    const result = builder.build({ ingredients: ['گوجه'] });

    expect(result.system).toContain('ارقام فارسی');
    expect(result.system).toContain('۰۱۲۳۴۵۶۷۸۹');
    expect(result.system).toContain('عدد JSON');
  });

  it('instructs one ingredient per entry in the system prompt', () => {
    const result = builder.build({ ingredients: ['گوجه'] });

    expect(result.system).toContain('هر ماده یک شیء جداگانه');
    expect(result.system).toContain('ترکیب نکنید');
  });

  it('instructs total-dish calorie semantics in the system prompt', () => {
    const result = builder.build({ ingredients: ['گوجه'], calorieLimit: 500 });

    expect(result.system).toContain('کالری کل غذا');
    expect(result.system).toContain('هم‌خوان');
    expect(result.system).toContain('کم‌چرب');
  });

  it('restricts main cooking tools to the user list while allowing basic hand utensils', () => {
    const result = builder.build({ ingredients: ['گوجه'], tools: ['تابه'] });

    expect(result.system).toContain('ابزارِ پختِ اصلی');
    expect(result.system).toContain('ابزارهای دستی');
    expect(result.system).toContain('رنده');
  });

  it('forbids generic titles and requires an authentic Iranian dish name', () => {
    const result = builder.build({ ingredients: ['گوجه'] });

    expect(result.system).toContain('واویشکا');
    expect(result.system).toContain('اصیل');
    expect(result.system).toContain('خوراک');
    expect(result.system).toContain('غذای');
  });

  it('requires calories to match listed ingredients and adjust oil or lean meat', () => {
    const result = builder.build({ ingredients: ['گوجه'], calorieLimit: 400 });

    expect(result.system).toContain('هم‌خوان');
    expect(result.system).toContain('مقدار روغن را کم');
    expect(result.system).toContain('کم‌چرب');
  });

  it('instructs authentic Persian naming and pantry-only extras in the system prompt', () => {
    const result = builder.build({ ingredients: ['گوجه'] });

    expect(result.system).toContain('نام سنتی');
    expect(result.system).toContain('مواد پایه رایج');
  });

  it('instructs robustness when constraints are hard to satisfy', () => {
    const result = builder.build({ ingredients: ['گوجه'], calorieLimit: 100 });

    expect(result.system).toContain('نزدیک‌ترین دستور پخت معتبر');
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
