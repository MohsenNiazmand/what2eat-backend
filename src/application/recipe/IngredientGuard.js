import { ContentModerationError } from '../../domain/errors/AppError.js';
import { PersianTextGuard } from './PersianTextGuard.js';
import {
  BLOCKED_TERM_PATTERNS,
  MULTI_WORD_BLOCKED_TERMS,
  MULTI_WORD_BLOCKED_TOOL_TERMS,
  SINGLE_WORD_BLOCKED_TERMS,
  SINGLE_WORD_BLOCKED_TOOL_TERMS,
} from './blockedIngredientTerms.js';

const PERSIAN_DIGITS = '۰۱۲۳۴۵۶۷۸۹';
const ARABIC_DIGITS = '٠١٢٣٤٥٦٧٨٩';

export class IngredientGuard {
  constructor(persianTextGuard = new PersianTextGuard()) {
    this.persianTextGuard = persianTextGuard;
  }

  validate({ ingredients, tools = [] }) {
    this.validateRecipeInput({ ingredients, tools });
  }

  validateRecipeInput({ ingredients = [], tools = [], exclusions = [], notes }) {
    const noteValues = notes ? [notes] : [];

    this.persianTextGuard.validate([...ingredients, ...tools, ...exclusions, ...noteValues]);

    for (const ingredient of ingredients) {
      if (this._isBlocked(ingredient, 'ingredient')) {
        throw new ContentModerationError();
      }
    }

    for (const tool of tools) {
      if (this._isBlocked(tool, 'tool')) {
        throw new ContentModerationError();
      }
    }

    for (const exclusion of exclusions) {
      if (this._isBlocked(exclusion, 'ingredient')) {
        throw new ContentModerationError();
      }
    }

    if (notes && this._isBlocked(notes, 'ingredient')) {
      throw new ContentModerationError();
    }
  }

  _isBlocked(value, kind) {
    const normalized = this._normalize(value);
    if (!normalized) {
      return false;
    }

    const tokens = this._tokenize(normalized);

    for (const pattern of BLOCKED_TERM_PATTERNS) {
      if (pattern.test(normalized)) {
        return true;
      }

      for (const token of tokens) {
        if (pattern.test(token)) {
          return true;
        }
      }
    }

    const singleWordTerms =
      kind === 'tool'
        ? [...SINGLE_WORD_BLOCKED_TERMS, ...SINGLE_WORD_BLOCKED_TOOL_TERMS]
        : SINGLE_WORD_BLOCKED_TERMS;
    const multiWordTerms =
      kind === 'tool'
        ? [...MULTI_WORD_BLOCKED_TERMS, ...MULTI_WORD_BLOCKED_TOOL_TERMS]
        : MULTI_WORD_BLOCKED_TERMS;

    for (const term of singleWordTerms) {
      const normalizedTerm = this._normalize(term);
      if (tokens.includes(normalizedTerm)) {
        return true;
      }
    }

    for (const phrase of multiWordTerms) {
      const normalizedPhrase = this._normalize(phrase);
      if (normalized.includes(normalizedPhrase)) {
        return true;
      }
    }

    return false;
  }

  _normalize(value) {
    if (typeof value !== 'string') {
      return '';
    }

    let text = value.trim().toLowerCase();
    text = text.replace(/[\u0640\u200c\u200d]/g, '');
    text = text.replace(/[يى]/g, 'ی');
    text = text.replace(/[ك]/g, 'ک');
    text = text.replace(/[ة]/g, 'ه');
    text = text.replace(/[ؤ]/g, 'و');
    text = text.replace(/[إأآ]/g, 'ا');

    for (let i = 0; i < PERSIAN_DIGITS.length; i += 1) {
      text = text.replaceAll(PERSIAN_DIGITS[i], String(i));
      text = text.replaceAll(ARABIC_DIGITS[i], String(i));
    }

    text = text.replace(/[^\p{L}\p{N}\s]/gu, ' ');
    text = text.replace(/\s+/g, ' ').trim();

    return text;
  }

  _tokenize(normalizedText) {
    return normalizedText.split(/[\s,،\-+]+/).filter(Boolean);
  }
}
