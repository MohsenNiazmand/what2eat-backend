import { AppError } from '../../../domain/errors/AppError.js';

export function errorHandler(err, req, res, _next) {
  if (err instanceof AppError) {
    const body = {
      success: false,
      message: err.message,
    };

    if (err.code) {
      body.code = err.code;
    }

    return res.status(err.statusCode).json(body);
  }

  console.error(err);
  return res.status(500).json({
    success: false,
    message: 'Internal server error',
  });
}
