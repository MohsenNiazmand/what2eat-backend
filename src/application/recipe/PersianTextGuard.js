import { NonPersianTextError } from '../../domain/errors/AppError.js';

const LATIN_LETTER_PATTERN = /[A-Za-z]/;

export class PersianTextGuard {
  validate(values) {
    for (const value of values) {
      if (this._containsLatinLetters(value)) {
        throw new NonPersianTextError();
      }
    }
  }

  _containsLatinLetters(value) {
    return typeof value === 'string' && LATIN_LETTER_PATTERN.test(value);
  }
}
