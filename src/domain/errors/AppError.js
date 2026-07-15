export class AppError extends Error {
  constructor(message, statusCode = 500, code = undefined) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.name = this.constructor.name;
  }
}

export class ValidationError extends AppError {
  constructor(message) {
    super(message, 400);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Invalid or expired OTP') {
    super(message, 401);
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Resource not found') {
    super(message, 404);
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Resource conflict') {
    super(message, 409);
  }
}

export class ExternalServiceError extends AppError {
  constructor(message = 'External service failure') {
    super(message, 502);
  }
}

export class ContentModerationError extends AppError {
  constructor(
    message = 'برخی مواد وارد شده برای پخت غذا مناسب نیست. لطفاً مواد خوردنی واقعی وارد کنید.'
  ) {
    super(message, 422, 'FORBIDDEN_INGREDIENTS');
  }
}

export class NonPersianTextError extends AppError {
  constructor(message = 'فقط حروف فارسی مجاز است. عدد فارسی یا انگلیسی مشکلی ندارد.') {
    super(message, 422, 'NON_PERSIAN_TEXT');
  }
}
