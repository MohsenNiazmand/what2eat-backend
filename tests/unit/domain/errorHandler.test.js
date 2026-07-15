import { ContentModerationError, ValidationError, NonPersianTextError } from '../../../src/domain/errors/AppError.js';
import { errorHandler } from '../../../src/interfaces/http/middlewares/errorHandler.js';

function createMockResponse() {
  const res = {
    statusCode: null,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
  };
  return res;
}

describe('errorHandler', () => {
  it('includes machine-readable code for ContentModerationError', () => {
    const res = createMockResponse();
    const err = new ContentModerationError();

    errorHandler(err, {}, res, () => {});

    expect(res.statusCode).toBe(422);
    expect(res.body).toEqual({
      success: false,
      message: 'برخی مواد وارد شده برای پخت غذا مناسب نیست. لطفاً مواد خوردنی واقعی وارد کنید.',
      code: 'FORBIDDEN_INGREDIENTS',
    });
  });

  it('includes machine-readable code for NonPersianTextError', () => {
    const res = createMockResponse();
    const err = new NonPersianTextError();

    errorHandler(err, {}, res, () => {});

    expect(res.statusCode).toBe(422);
    expect(res.body).toEqual({
      success: false,
      message: 'فقط حروف فارسی مجاز است. عدد فارسی یا انگلیسی مشکلی ندارد.',
      code: 'NON_PERSIAN_TEXT',
    });
  });

  it('omits code for errors without one', () => {
    const res = createMockResponse();
    const err = new ValidationError('name is required');

    errorHandler(err, {}, res, () => {});

    expect(res.statusCode).toBe(400);
    expect(res.body).toEqual({
      success: false,
      message: 'name is required',
    });
  });
});
