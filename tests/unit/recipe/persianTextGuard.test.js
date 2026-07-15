import { NonPersianTextError } from '../../../src/domain/errors/AppError.js';
import { PersianTextGuard } from '../../../src/application/recipe/PersianTextGuard.js';

describe('PersianTextGuard', () => {
  let guard;

  beforeEach(() => {
    guard = new PersianTextGuard();
  });

  it('allows Persian ingredient and tool names', () => {
    expect(() => guard.validate(['گوجه', 'پیاز', 'گوشت گوسفند', 'تابه', 'قابلمه'])).not.toThrow();
  });

  it('allows Persian and ASCII digits', () => {
    expect(() => guard.validate(['تخم مرغ ۲ عدد', 'گوجه 2 عدد', '123'])).not.toThrow();
  });

  it.each([
    ['tomato'],
    ['گوجه tomato'],
    ['گوشت beef'],
    ['iPhone'],
  ])('rejects Latin letters in input: %s', (value) => {
    expect(() => guard.validate([value])).toThrow(NonPersianTextError);
    expect(() => guard.validate([value])).toThrow(
      'فقط حروف فارسی مجاز است. عدد فارسی یا انگلیسی مشکلی ندارد.'
    );
  });

  it('exposes NON_PERSIAN_TEXT error code', () => {
    try {
      guard.validate(['tomato']);
    } catch (error) {
      expect(error).toBeInstanceOf(NonPersianTextError);
      expect(error.code).toBe('NON_PERSIAN_TEXT');
      expect(error.statusCode).toBe(422);
    }
  });
});
