import { ValidationError } from '../../domain/errors/AppError.js';
import { RecipeOptionsService } from './RecipeOptionsService.js';
import { COUNTRIES, DIETARY_PREFERENCES } from './recipeOptionsConfig.js';

export class PromptBuilder {
  constructor(recipeOptionsService = new RecipeOptionsService()) {
    this.recipeOptionsService = recipeOptionsService;
  }

  build(input) {
    if (!input || !this._hasValidConstraints(input)) {
      throw new ValidationError(
        'حداقل یکی از این فیلدها باید مشخص شود: countries، dietaryPreferences، ingredients، calorieLimit، servings، notes'
      );
    }

    const ingredients = Array.isArray(input.ingredients) ? input.ingredients : [];
    const tools = Array.isArray(input.tools) ? input.tools : [];
    const countries = Array.isArray(input.countries) ? input.countries : [];
    const dietaryPreferences = Array.isArray(input.dietaryPreferences) ? input.dietaryPreferences : [];
    const exclusions = Array.isArray(input.exclusions) ? input.exclusions : [];
    const notes = typeof input.notes === 'string' ? input.notes.trim() : '';
    const calorieLimit =
      typeof input.calorieLimit === 'number' && input.calorieLimit > 0 ? input.calorieLimit : null;
    const servings = typeof input.servings === 'number' && input.servings > 0 ? input.servings : null;
    const hasIngredients = ingredients.length > 0;

    const countryLabels = countries.map((id) => this._resolveCountryLabel(id));
    const dietaryLabels = dietaryPreferences.map((id) => this._resolveDietaryLabel(id));

    const systemPrompt = [
      'شما یک آشپز و مشاور غذایی فارسی‌زبان هستید.',
      'باید فقط یک JSON معتبر پاسخ دهید؛ بدون Markdown، بدون کدفنس و بدون متن اضافه.',
      'اسکیما باید دقیقاً این ساختار را داشته باشد: {"title":"string — نام غذا به فارسی","description":"string — توضیح کوتاه","ingredients":[{"name":"string","amount":"string"}],"instructions":["string — مرحله به ترتیب"],"calories":0,"prepTime":0,"cookTime":0,"servings":0,"category":"string"}.',
      'در خروجی JSON از کلیدهای title، ingredients، instructions، calories، prepTime، cookTime، servings، category استفاده کنید و فقط JSON بازگردانید.',
      'مواد را به فارسی و با دقت مشخص کنید.',
      'مقادیر amount در ingredients و اعداد داخل instructions باید با ارقام فارسی (۰۱۲۳۴۵۶۷۸۹) نوشته شوند. فیلدهای calories، prepTime، cookTime و servings باید عدد JSON باشند، نه رشته.',
      'هر ماده یک شیء جداگانه در ingredients باشد؛ چند ماده را در یک ورودی ترکیب نکنید.',
      'فیلد calories باید کالری کل غذا (همه‌ی پرس‌ها) و با مواد و مقادیرِ دقیقی که در ingredients نوشته‌ای هم‌خوان و واقع‌بینانه باشد.',
      'اول نزدیک‌ترین غذای واقعی و شناخته‌شده در فرهنگ و سنت کشور یا کشورهای انتخاب‌شده را پیشنهاد بده؛ با نام، مواد و روش پخت معتبر همان آشپزی.',
      'اگر کشور مشخص نشده، می‌توانی از هر آشپزی معتبر جهانی استفاده کنی.',
      'اگر ترکیب سنتی و رسمی در هیچ فرهنگی وجود نداشت، می‌توانی دستور جدید ولی واقع‌بینانه و قابل پخت بسازی.',
      'دستور باید غذای واقعی، درست و قابل پخت باشد؛ زمان‌ها و مراحل با نوع غذا هم‌خوان باشند.',
      hasIngredients
        ? 'فقط از مواد کاربر به‌علاوه مواد پایه رایج (نمک، فلفل، ادویه، روغن، آب) استفاده کن؛ ماده اصلی جدیدی که کاربر نداده اضافه نکن.'
        : 'مواد را خودت انتخاب کن؛ باید با محدودیت‌های کالری، تعداد، کشور، رژیم و توضیحات کاربر سازگار و واقع‌بینانه باشند.',
      tools.length > 0
        ? 'ابزارِ پختِ اصلی (مثل تابه، قابلمه، فر، مایکروویو، مخلوط‌کن) را فقط از لیست ابزارهای کاربر انتخاب کن؛ ابزارهای دستی پایه مثل چاقو، قاشق، کاسه و رنده همیشه مجازند.'
        : 'ابزارهای متداول آشپزخانه را می‌توانی فرض کنی.',
      exclusions.length > 0
        ? 'غذاهای لیست استثنا را پیشنهاد نده؛ جایگزین معتبر از همان فرهنگ یا محدودیت‌ها انتخاب کن.'
        : null,
      'هرگز از مواد غیرغذایی، بهداشتی، جنسی، توهین‌آمیز، خطرناک یا سمی استفاده نکن.',
      'اگر محدودیت‌ها سخت باشند، نزدیک‌ترین دستور پخت معتبر را برگردان؛ JSON را نشکن.',
    ]
      .filter(Boolean)
      .join(' ');

    const userParts = ['یک دستور پخت حرفه‌ای پیشنهاد بده.'];

    if (countryLabels.length > 0) {
      userParts.push(`کشور/آشپزی: ${countryLabels.join('، ')}`);
    } else {
      userParts.push('کشور مشخص نشده؛ همه آشپزی‌های جهانی مجاز است.');
    }

    if (dietaryLabels.length > 0) {
      userParts.push(`رژیم/ترجیح غذایی: ${dietaryLabels.join('، ')}`);
    }

    if (hasIngredients) {
      userParts.push(`مواد موجود: ${ingredients.join('، ')}`);
    }

    if (tools.length > 0) {
      userParts.push(`فقط با این ابزارها: ${tools.join('، ')}`);
    }

    if (calorieLimit !== null) {
      userParts.push(`سقف کالری کل غذا (همه‌ی پرس‌ها): حداکثر ${calorieLimit} کالری`);
    }

    if (servings !== null) {
      userParts.push(`برای ${servings} نفر`);
    }

    if (exclusions.length > 0) {
      userParts.push(`این غذاها را پیشنهاد نده: ${exclusions.join('، ')}`);
    }

    if (notes.length > 0) {
      userParts.push(`توضیحات کاربر: ${notes}`);
    }

    return {
      system: systemPrompt,
      user: userParts.join(' '),
    };
  }

  _hasValidConstraints(input) {
    const countries = Array.isArray(input.countries) ? input.countries : [];
    const dietaryPreferences = Array.isArray(input.dietaryPreferences) ? input.dietaryPreferences : [];
    const ingredients = Array.isArray(input.ingredients) ? input.ingredients : [];
    const notes = typeof input.notes === 'string' ? input.notes.trim() : '';
    const calorieLimit = input.calorieLimit;
    const servings = input.servings;

    return (
      countries.length > 0 ||
      dietaryPreferences.length > 0 ||
      ingredients.length > 0 ||
      (typeof calorieLimit === 'number' && calorieLimit > 0) ||
      (typeof servings === 'number' && servings > 0) ||
      notes.length > 0
    );
  }

  _resolveCountryLabel(id) {
    const country = COUNTRIES.find((item) => item.id === id);
    return country?.label ?? id;
  }

  _resolveDietaryLabel(id) {
    const preference = DIETARY_PREFERENCES.find((item) => item.id === id);
    return preference?.label ?? id;
  }
}
