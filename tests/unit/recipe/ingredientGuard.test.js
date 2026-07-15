import { ContentModerationError } from '../../../src/domain/errors/AppError.js';
import { IngredientGuard } from '../../../src/application/recipe/IngredientGuard.js';

describe('IngredientGuard', () => {
  let guard;

  beforeEach(() => {
    guard = new IngredientGuard();
  });

  const validateIngredients = (ingredients, tools = []) => {
    guard.validate({ ingredients, tools });
  };

  it('allows common food ingredients including animals', () => {
    expect(() =>
      validateIngredients([
        'گوجه',
        'پیاز',
        'گوشت چرخ‌کرده',
        'آب',
        'نمک',
        'خامه',
        'زمینی',
        'تخم مرغ',
        'گوسفند',
        'مرغ',
        'گاو',
        'ماهی',
        'میگو',
      ])
    ).not.toThrow();
  });

  it('allows playful but harmless ingredients such as water and salt', () => {
    expect(() => validateIngredients(['آب', 'نمک'])).not.toThrow();
  });

  it.each([
    ['مدفوع'],
    ['ادرار'],
    ['منی'],
    ['مدفوع انسان'],
  ])('blocks non-edible body-waste ingredient: %s', (ingredient) => {
    expect(() => validateIngredients([ingredient])).toThrow(ContentModerationError);
    expect(() => validateIngredients([ingredient])).toThrow(
      'برخی مواد وارد شده برای پخت غذا مناسب نیست. لطفاً مواد خوردنی واقعی وارد کنید.'
    );
  });

  it.each([
    ['کیر'],
    ['کص'],
    ['کون'],
    ['جنده'],
  ])('blocks sexual or profane ingredient: %s', (ingredient) => {
    expect(() => validateIngredients([ingredient])).toThrow(ContentModerationError);
  });

  it.each([
    ['بنزین'],
    ['وایتکس'],
    ['سم'],
    ['اسید'],
  ])('blocks dangerous non-food ingredient: %s', (ingredient) => {
    expect(() => validateIngredients([ingredient])).toThrow(ContentModerationError);
  });

  it.each([
    ['زنم'],
    ['پسرم'],
    ['دخترعمو'],
    ['رفیقم'],
    ['همسایه'],
    ['مادرم'],
  ])('blocks family or people references as ingredients: %s', (ingredient) => {
    expect(() => validateIngredients([ingredient])).toThrow(ContentModerationError);
  });

  it.each([
    ['شیشه'],
    ['هروئین'],
    ['تریاک'],
    ['کوکائین'],
  ])('blocks drug-related ingredient: %s', (ingredient) => {
    expect(() => validateIngredients([ingredient])).toThrow(ContentModerationError);
  });

  it.each([
    ['وودکا'],
    ['شراب'],
    ['آبجو'],
    ['عرق سگی'],
  ])('blocks alcoholic ingredient: %s', (ingredient) => {
    expect(() => validateIngredients([ingredient])).toThrow(ContentModerationError);
  });

  it.each([
    ['قرص'],
    ['دارو'],
    ['زاناکس'],
    ['استامینوفن'],
  ])('blocks medication or pill ingredient: %s', (ingredient) => {
    expect(() => validateIngredients([ingredient])).toThrow(ContentModerationError);
  });

  it.each([
    ['محمد'],
    ['امام حسین'],
    ['فاطمه'],
    ['پیامبر'],
  ])('blocks religious figure names as ingredients: %s', (ingredient) => {
    expect(() => validateIngredients([ingredient])).toThrow(ContentModerationError);
  });

  it.each([
    ['خامنه‌ای'],
    ['ترامپ'],
    ['پوتین'],
    ['مسی'],
  ])('blocks famous person names as ingredients: %s', (ingredient) => {
    expect(() => validateIngredients([ingredient])).toThrow(ContentModerationError);
  });

  it.each([
    ['ماشین'],
    ['موبایل'],
    ['تخت'],
    ['پتو'],
  ])('blocks non-food objects as ingredients: %s', (ingredient) => {
    expect(() => validateIngredients([ingredient])).toThrow(ContentModerationError);
  });

  it.each([
    ['ماشین'],
    ['موبایل'],
    ['دوچرخه'],
    ['تخت'],
  ])('blocks non-kitchen tools: %s', (tool) => {
    expect(() => validateIngredients(['گوجه'], [tool])).toThrow(ContentModerationError);
  });

  it('allows legitimate kitchen tools', () => {
    expect(() => validateIngredients(['گوجه'], ['تابه', 'قابلمه', 'منقل'])).not.toThrow();
  });

  it('does not block food words that merely contain blocked substrings', () => {
    expect(() => validateIngredients(['زمینی', 'خامه', 'سینه مرغ', 'نعنا', 'کرم'])).not.toThrow();
  });

  it('blocks when any ingredient in the list is forbidden', () => {
    expect(() => validateIngredients(['گوجه', 'مدفوع', 'پیاز'])).toThrow(ContentModerationError);
  });

  it('normalizes spacing and punctuation before matching', () => {
    expect(() => validateIngredients(['  مدفوع  '])).toThrow(ContentModerationError);
    expect(() => validateIngredients(['مدفوع،'])).toThrow(ContentModerationError);
  });

  it('exposes FORBIDDEN_INGREDIENTS error code on ContentModerationError', () => {
    try {
      validateIngredients(['مدفوع']);
    } catch (error) {
      expect(error).toBeInstanceOf(ContentModerationError);
      expect(error.code).toBe('FORBIDDEN_INGREDIENTS');
      expect(error.statusCode).toBe(422);
    }
  });
});
