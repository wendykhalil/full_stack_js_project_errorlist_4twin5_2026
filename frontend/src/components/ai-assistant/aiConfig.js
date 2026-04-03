// Define constants FIRST (before using them)
const TUNISIA_CITIES = [
  "Tunis", "Ariana", "Ben Arous", "Manouba", "Nabeul", "Sousse", "Monastir", "Mahdia", "Sfax", 
  "Kairouan", "Bizerte", "Beja", "Jendouba", "Le Kef", "Siliana", "Zaghouan", "Kasserine", 
  "Sidi Bouzid", "Gabès", "Gafsa", "Tozeur", "Kébili", "Medenine", "Tataouine"
];

const PROJECT_CATEGORIES = [
  "Villa", "Appartement", "Bureau", "Magasin", "Restaurant", "Immeuble", "Entrepôt", "Usine",
  "Rénovation", "Construction neuve", "Extension", "Aménagement intérieur", "Façade", "Toiture",
  "Peinture", "Plomberie", "Électricité", "Carrelage", "Menuiserie", "Climatisation", "Isolation", "Piscine/Jardin"
];

// This maps form fields to AI questions with examples in multiple languages
export const PROJECT_FIELDS = [
  {
    name: 'title',
    question: {
      ar: 'شنوّة اسم المشروع متاعك؟',
      fr: 'Quel est le nom de votre projet ?',
      en: 'What is your project title?'
    },
    example: {
      ar: 'مثال: بناء دار، تصليح حمّام، تزين مطبخ',
      fr: 'Exemple: Construction villa, Rénovation salle de bain',
      en: 'Example: Villa construction, Bathroom renovation'
    },
    type: 'text',
    required: true,
    validation: (value) => value && value.trim().length > 0 ? null : 'Title is required'
  },
  {
    name: 'category',
    question: {
      ar: 'شنوّة نوع المشروع؟',
      fr: 'Quelle est la catégorie du projet ?',
      en: 'What is the project category?'
    },
    example: {
      ar: `مثال: ${PROJECT_CATEGORIES.slice(0, 5).join('، ')}... (أو أي كلمة أخرى)`,
      fr: `Exemple: ${PROJECT_CATEGORIES.slice(0, 5).join(', ')}... (ou tout autre mot)`,
      en: `Example: ${PROJECT_CATEGORIES.slice(0, 5).join(', ')}... (or any other word)`
    },
    type: 'text',  // Changed from 'select' to 'text' to allow free input
    options: PROJECT_CATEGORIES,  // Keep for suggestions
    required: true,
    validation: (value) => value && value.trim().length > 0 ? null : 'Category is required'  // No enum validation
  },
  {
    name: 'status',
    question: {
      ar: 'شنوّة حالة المشروع؟',
      fr: 'Quel est le statut du projet ?',
      en: 'What is the project status?'
    },
    example: {
      ar: 'مثال: قيد الانتظار، نشط، مكتمل',
      fr: 'Exemple: En attente, Actif, Terminé',
      en: 'Example: Pending, Active, Completed'
    },
    type: 'select',
    options: ['PENDING', 'ACTIVE', 'COMPLETED'],
    defaultValue: 'PENDING',
    required: false
  },
  {
    name: 'description',
    question: {
      ar: 'أشرلي على المشروع بالتفصيل. شنوّة المطلوب بالضبط؟',
      fr: 'Décrivez le projet en détail. Qu\'est-ce qui est exactement demandé ?',
      en: 'Describe the project in detail. What exactly is needed?'
    },
    example: {
      ar: 'مثال: نحت نجار باش يصنع دولاب مطبخ بطول 3 متر...',
      fr: 'Exemple: Besoin d\'un menuisier pour fabriquer une armoire de cuisine...',
      en: 'Example: Need a carpenter to build a 3m kitchen cabinet...'
    },
    type: 'textarea',
    required: false
  },
  {
    name: 'city',
    question: {
      ar: 'في ولاية شنوّة المشروع؟',
      fr: 'Dans quelle ville se trouve le projet ?',
      en: 'Which city is the project in?'
    },
    example: {
      ar: `مثال: ${TUNISIA_CITIES.slice(0, 5).join('، ')}`,
      fr: `Exemple: ${TUNISIA_CITIES.slice(0, 5).join(', ')}`,
      en: `Example: ${TUNISIA_CITIES.slice(0, 5).join(', ')}`
    },
    type: 'text',
    options: TUNISIA_CITIES,
    required: true,
    validation: (value) => value && value.trim().length > 0 ? null : 'City is required'
  },
  {
    name: 'address',
    question: {
      ar: 'العنوان بالتفصيل (شارع، نهج، عدد)',
      fr: 'Adresse détaillée (rue, avenue, numéro)',
      en: 'Detailed address (street, avenue, number)'
    },
    example: {
      ar: 'مثال: نهج الحرية 25، المنزه',
      fr: 'Exemple: 25 Rue de la Liberté, Mutuelleville',
      en: 'Example: 25 Freedom Street, Menzah'
    },
    type: 'text',
    required: false
  },
  {
    name: 'budgetTND',
    question: {
      ar: 'شنوّة الميزانية التقريبية بالدينار التونسي؟',
      fr: 'Quel est le budget approximatif en TND ?',
      en: 'What is the approximate budget in TND?'
    },
    example: {
      ar: 'مثال: 15000، 25000، 50000',
      fr: 'Exemple: 15000, 25000, 50000',
      en: 'Example: 15000, 25000, 50000'
    },
    type: 'number',
    required: false,
    validation: (value) => !value || !isNaN(parseFloat(value)) ? null : 'Please enter a valid number'
  },
  {
    name: 'surfaceM2',
    question: {
      ar: 'شنوّة المساحة بالمتر المربع؟',
      fr: 'Quelle est la surface en mètres carrés ?',
      en: 'What is the surface area in square meters?'
    },
    example: {
      ar: 'مثال: 120، 200، 350',
      fr: 'Exemple: 120, 200, 350',
      en: 'Example: 120, 200, 350'
    },
    type: 'number',
    required: false
  },
  {
    name: 'startDate',
    question: {
      ar: 'تاريخ البداية المتوقع؟',
      fr: 'Date de début prévue ?',
      en: 'Expected start date?'
    },
    example: {
      ar: 'مثال: 2024-05-01',
      fr: 'Exemple: 2024-05-01',
      en: 'Example: 2024-05-01'
    },
    type: 'date',
    required: false
  },
  {
    name: 'endDate',
    question: {
      ar: 'تاريخ النهاية المتوقع؟',
      fr: 'Date de fin prévue ?',
      en: 'Expected end date?'
    },
    example: {
      ar: 'مثال: 2024-10-01',
      fr: 'Exemple: 2024-10-01',
      en: 'Example: 2024-10-01'
    },
    type: 'date',
    required: false
  },
  {
    name: 'phoneNumber',
    question: {
      ar: 'رقم الهاتف متاعك للتواصل؟',
      fr: 'Votre numéro de téléphone pour vous contacter ?',
      en: 'Your phone number for contact?'
    },
    example: {
      ar: 'مثال: 12345678 أو +21612345678',
      fr: 'Exemple: 12345678 ou +21612345678',
      en: 'Example: 12345678 or +21612345678'
    },
    type: 'tel',
    required: true,
    validation: (value) => value && value.trim().length > 0 ? null : 'Phone number is required'
  },
  {
    name: 'materials',
    question: {
      ar: 'شنوّة المواد اللي باش تستعملها؟ (قدر تقولّي 3 أو 4 مواد)',
      fr: 'Quels matériaux allez-vous utiliser ? (vous pouvez en citer 3 ou 4)',
      en: 'What materials will you use? (you can mention 3 or 4)'
    },
    example: {
      ar: 'مثال: اسمنت، حديد، قرميد، دهان',
      fr: 'Exemple: Ciment, Fer, Brique, Peinture',
      en: 'Example: Cement, Iron, Brick, Paint'
    },
    type: 'materials',
    required: false
  },
  {
    name: 'images',
    question: {
      ar: 'تحب تزيد صور للمشروع؟ (أقصى 6 صور)',
      fr: 'Voulez-vous ajouter des images du projet ? (6 images maximum)',
      en: 'Would you like to add project images? (max 6 images)'
    },
    example: {
      ar: 'مثال: صور للمخططات، الواجهة، الأعمال...',
      fr: 'Exemple: Photos des plans, de la façade, des travaux...',
      en: 'Example: Photos of plans, facade, work in progress...'
    },
    type: 'images',
    required: false
  }
];

// Language detection patterns
export const LANGUAGE_PATTERNS = {
  ar: /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]|(شنوّة|شنوة|أهلا|مرحبا|باهي|عليك|تبارك)/i,
  fr: /\b(bonjour|salut|projet|travaux|maison|appartement|combien|prix|devis|merci|s'il vous plaît)\b/i,
  en: /\b(hello|hi|project|work|house|apartment|how much|price|quote|thanks|please)\b/i
};

export const SUPPORTED_LANGUAGES = ['ar', 'fr', 'en'];

// Helper to detect user's language from message
export function detectLanguage(text) {
  for (const [lang, pattern] of Object.entries(LANGUAGE_PATTERNS)) {
    if (pattern.test(text)) return lang;
  }
  return 'fr';
}

export function getQuestion(field, language) {
  return field.question[language] || field.question.fr;
}

export function getExample(field, language) {
  return field.example[language] || field.example.fr;
}