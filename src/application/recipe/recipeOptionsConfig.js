export const COUNTRIES = [
  { id: 'iran', label: 'ایران', freeTier: true },
  { id: 'italy', label: 'ایتالیا', freeTier: true },
  { id: 'turkey', label: 'ترکیه', freeTier: true },
  { id: 'india', label: 'هند', freeTier: true },
  { id: 'mexico', label: 'مکزیک', freeTier: false },
  { id: 'japan', label: 'ژاپن', freeTier: false },
  { id: 'france', label: 'فرانسه', freeTier: false },
  { id: 'china', label: 'چین', freeTier: false },
  { id: 'greece', label: 'یونان', freeTier: false },
  { id: 'lebanon', label: 'لبنان', freeTier: true },
  { id: 'thailand', label: 'تایلند', freeTier: false },
  { id: 'usa', label: 'آمریکا', freeTier: false },
];

export const DIETARY_PREFERENCES = [
  { id: 'vegan', label: 'وگان', freeTier: true },
  { id: 'vegetarian', label: 'گیاهخوار', freeTier: true },
  { id: 'halal', label: 'حلال', freeTier: true },
  { id: 'gluten_free', label: 'بدون گلوتن', freeTier: true },
  { id: 'low_carb', label: 'کم‌کربوهیدرات', freeTier: false },
  { id: 'high_protein', label: 'پروتئین بالا', freeTier: false },
  { id: 'dairy_free', label: 'بدون لبنیات', freeTier: true },
  { id: 'keto', label: 'کتو', freeTier: false },
];

export const NOTES_MAX_LENGTH = 500;

export const RECIPE_CONSTRAINT_FIELDS = [
  'countries',
  'dietaryPreferences',
  'ingredients',
  'calorieLimit',
  'servings',
  'notes',
];
