import { ValidationError } from '../../domain/errors/AppError.js';

export class PromptBuilder {
  build(input) {
    if (!input || !Array.isArray(input.ingredients) || input.ingredients.length === 0) {
      throw new ValidationError('ingredients is required and must be a non-empty array');
    }

    const ingredients = input.ingredients.join(', ');
    const tools = Array.isArray(input.tools) && input.tools.length > 0 ? input.tools : [];
    const calorieLimit = typeof input.calorieLimit === 'number' && input.calorieLimit > 0 ? input.calorieLimit : null;
    const servings = typeof input.servings === 'number' && input.servings > 0 ? input.servings : null;

    const systemPrompt = [
      'شما یک آشپز و مشاور غذایی فارسی‌زبان هستید.',
      'باید فقط یک JSON معتبر پاسخ دهید؛ بدون Markdown، بدون کدفنس و بدون متن اضافه.',
      'اسکیما باید دقیقاً این ساختار را داشته باشد: {"title":"string — نام غذا به فارسی","description":"string — توضیح کوتاه","ingredients":[{"name":"string","amount":"string"}],"instructions":["string — مرحله به ترتیب"],"calories":0,"prepTime":0,"cookTime":0,"servings":0,"category":"string"}.',
      'در خروجی JSON از کلیدهای title، ingredients، instructions، calories، prepTime، cookTime، servings، category استفاده کنید و فقط JSON بازگردانید.',
      'مواد را به فارسی و با دقت مشخص کنید.'
    ].join(' ');

    const userParts = [
      'یک دستور پخت حرفه‌ای برای این مواد پیشنهاد بده:',
      `مواد: ${ingredients}`,
    ];

    if (tools.length > 0) {
      userParts.push(`ابزارهای موجود: ${tools.join(', ')}`);
    }

    if (calorieLimit !== null) {
      userParts.push(`حداکثر ${calorieLimit} کالری`);
    }

    if (servings !== null) {
      userParts.push(`برای ${servings} نفر`);
    }

    return {
      system: systemPrompt,
      user: userParts.join(' '),
    };
  }
}
