import { ValidationError } from '../../domain/errors/AppError.js';

export class PromptBuilder {
  build(input) {
    if (!input || !Array.isArray(input.ingredients) || input.ingredients.length === 0) {
      throw new ValidationError('ingredients is required and must be a non-empty array');
    }

    const ingredients = input.ingredients.join(', ');
    const tools = Array.isArray(input.tools) && input.tools.length > 0 ? input.tools : [];
    // calorieLimit applies to the whole dish (all servings); per-serving would be a one-line change here.
    const calorieLimit = typeof input.calorieLimit === 'number' && input.calorieLimit > 0 ? input.calorieLimit : null;
    const servings = typeof input.servings === 'number' && input.servings > 0 ? input.servings : null;

    const systemPrompt = [
      'شما یک آشپز و مشاور غذایی فارسی‌زبان هستید.',
      'باید فقط یک JSON معتبر پاسخ دهید؛ بدون Markdown، بدون کدفنس و بدون متن اضافه.',
      'اسکیما باید دقیقاً این ساختار را داشته باشد: {"title":"string — نام غذا به فارسی","description":"string — توضیح کوتاه","ingredients":[{"name":"string","amount":"string"}],"instructions":["string — مرحله به ترتیب"],"calories":0,"prepTime":0,"cookTime":0,"servings":0,"category":"string"}.',
      'در خروجی JSON از کلیدهای title، ingredients، instructions، calories، prepTime، cookTime، servings، category استفاده کنید و فقط JSON بازگردانید.',
      'مواد را به فارسی و با دقت مشخص کنید.',
      'مقادیر amount در ingredients و اعداد داخل instructions باید با ارقام فارسی (۰۱۲۳۴۵۶۷۸۹) نوشته شوند. فیلدهای calories، prepTime، cookTime و servings باید عدد JSON باشند، نه رشته.',
      'هر ماده یک شیء جداگانه در ingredients باشد؛ چند ماده را در یک ورودی ترکیب نکنید.',
      'فیلد calories باید کالری کل غذا (همه‌ی پرس‌ها) و با مواد و مقادیرِ دقیقی که در ingredients نوشته‌ای هم‌خوان و واقع‌بینانه باشد. برای رعایت سقف کالری، مقدار روغن را کم کن یا گوشت کم‌چرب انتخاب کن و همین را در amount مربوطه بنویس — صرفاً عدد کالری را روی سقف نگذار.',
      'نام غذا باید حتماً نام سنتی و اصیل ایرانی باشد اگر چنین نامی وجود دارد (مثل واویشکا، قیمه، کوکو، میرزاقاسمی)؛ از عناوین توصیفی و عمومی مثل «خوراک ...» یا «غذای ...» جداً خودداری کن.',
      'فقط از مواد کاربر به‌علاوه مواد پایه رایج (نمک، فلفل، ادویه، روغن، آب) استفاده کنید؛ ماده اصلی جدیدی که کاربر نداده اضافه نکنید.',
      'ابزارِ پختِ اصلی (مثل تابه، قابلمه، فر، مایکروویو، مخلوط‌کن) را فقط از لیست ابزارهای کاربر انتخاب کن و ابزار اصلی خارج از لیست را فرض نکن؛ اما ابزارهای دستیِ پایه مثل چاقو، قاشق، کاسه و رنده همیشه مجاز و در دسترس‌اند.',
      'اگر محدودیت‌ها سخت باشند، نزدیک‌ترین دستور پخت معتبر را برگردانید؛ JSON را نشکنید و توضیح خارج از JSON ننویسید.',
    ].join(' ');

    const userParts = [
      'یک دستور پخت حرفه‌ای برای این مواد پیشنهاد بده:',
      `مواد: ${ingredients}`,
    ];

    if (tools.length > 0) {
      userParts.push(`فقط با این ابزارها: ${tools.join(', ')}`);
    }

    if (calorieLimit !== null) {
      userParts.push(`سقف کالری کل غذا (همه‌ی پرس‌ها): حداکثر ${calorieLimit} کالری`);
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
