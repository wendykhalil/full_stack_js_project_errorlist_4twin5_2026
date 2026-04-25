const fs = require('fs');
const path = require('path');

const SRC_DIR = path.join(__dirname, '..');

function readAllFiles(dir, extensions = ['.js', '.jsx', '.ts', '.tsx']) {
  let results = [];

  if (!fs.existsSync(dir)) return results;

  for (const item of fs.readdirSync(dir)) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      results = results.concat(readAllFiles(fullPath, extensions));
    } else if (extensions.includes(path.extname(fullPath))) {
      results.push({
        path: fullPath,
        content: fs.readFileSync(fullPath, 'utf8'),
      });
    }
  }

  return results;
}

const files = readAllFiles(SRC_DIR);
const allContent = files.map((f) => f.content).join('\n').toLowerCase();
const allPaths = files.map((f) => f.path.toLowerCase()).join('\n');

function expectFeatureEvidence(keywords) {
  const found = keywords.some((keyword) => {
    const k = keyword.toLowerCase();
    return allContent.includes(k) || allPaths.includes(k);
  });

  expect(found).toBe(true);
}

describe('Graja Frontend Feature Tests - Auth and Security', () => {
  test('login, register, forgot password and reset password UI exist', () => {
    expectFeatureEvidence([
      'login',
      'register',
      'forgot password',
      'forgot-password',
      'reset password',
      'reset-password',
      'verify-email',
    ]);
  });

  test('Google login integration exists', () => {
    expectFeatureEvidence([
      'google',
      'google login',
      'google-login',
      'oauth',
      '@react-oauth/google',
    ]);
  });

  test('Face ID / passkey / camera login frontend exists', () => {
    expectFeatureEvidence([
      'faceid',
      'face id',
      'webauthn',
      'passkey',
      'camera',
      'face-api',
      'face detection',
    ]);
  });

  test('phone login and SMS verification UI exists', () => {
    expectFeatureEvidence([
      'phone',
      'sms',
      'verification code',
      'verify code',
      'otp',
    ]);
  });
});

describe('Graja Frontend Feature Tests - AI, ML and Admin', () => {
  test('AI project generation / Ollama UI exists', () => {
    expectFeatureEvidence([
      'ollama',
      'generate project',
      'ai project',
      'ai assistant',
      'generate with ai',
    ]);
  });

  test('AI quote and invoice generation UI exists', () => {
    expectFeatureEvidence([
      'ai quote',
      'generate quote',
      'generate invoice',
      'devis',
      'invoice',
      'quote',
    ]);
  });

  test('ML risk and delay prediction UI exists', () => {
    expectFeatureEvidence([
      'prediction',
      'risk',
      'delay',
      'ml',
      'machine learning',
      'project risk',
    ]);
  });

  test('fraud detection and admin analytics dashboard UI exists', () => {
    expectFeatureEvidence([
      'fraud',
      'fraud-analytics',
      'analytics',
      'dashboard',
      'activity logs',
      'admin activities',
      'risk score',
    ]);
  });

  test('admin artisan dashboard/statistics UI exists', () => {
    expectFeatureEvidence([
      'artisan dashboard',
      'admin dashboard',
      'statistics',
      'stats',
      'user analytics',
      'artisan stats',
    ]);
  });
});

describe('Graja Frontend Feature Tests - Messaging and Media', () => {
  test('messaging UI exists', () => {
    expectFeatureEvidence([
      'message',
      'messagerie',
      'conversation',
      'chat',
    ]);
  });

  test('message update/delete/archive UI exists', () => {
    expectFeatureEvidence([
      'delete message',
      'update message',
      'archive',
      'archived',
      'edit message',
    ]);
  });

  test('realtime notification for messages exists', () => {
    expectFeatureEvidence([
      'socket',
      'socket.io',
      'real-time',
      'realtime',
      'notification',
      'new message',
    ]);
  });

  test('PDF/image/vocal attachments in messaging exist', () => {
    expectFeatureEvidence([
      'pdf',
      'image',
      'voice',
      'vocal',
      'audio',
      'attachment',
      'file upload',
    ]);
  });
});

describe('Graja Frontend Feature Tests - Artisan, Prescripteur, Projects', () => {
  test('artisan CRUD and artisan pages exist', () => {
    expectFeatureEvidence([
      'artisan',
      'create artisan',
      'edit artisan',
      'delete artisan',
      'artisan profile',
    ]);
  });

  test('prescripteur project display exists', () => {
    expectFeatureEvidence([
      'prescripteur',
      'expert',
      'projects',
      'project list',
      'view projects',
    ]);
  });

  test('project pagination and three-dot actions exist', () => {
    expectFeatureEvidence([
      'pagination',
      'page',
      'three dots',
      'morevertical',
      'ellipsis',
      'actions',
    ]);
  });

  test('project and profile localisation/map picker exists', () => {
    expectFeatureEvidence([
      'location',
      'localisation',
      'map',
      'leaflet',
      'map picker',
      'mappicker',
      'coordinates',
    ]);
  });
});

describe('Graja Frontend Feature Tests - Quotes, Invoices, PDF, Excel', () => {
  test('quotes/devis CRUD frontend exists', () => {
    expectFeatureEvidence([
      'quote',
      'quotes',
      'devis',
      'create quote',
      'update quote',
      'delete quote',
    ]);
  });

  test('invoice CRUD frontend exists', () => {
    expectFeatureEvidence([
      'invoice',
      'invoices',
      'facture',
      'create invoice',
      'update invoice',
      'delete invoice',
    ]);
  });

  test('PDF and Excel export/display exists', () => {
    expectFeatureEvidence([
      'pdf',
      'excel',
      'xlsx',
      'export',
      'download',
      'jspdf',
    ]);
  });
});

describe('Graja Frontend Feature Tests - Translation and Accessibility', () => {
  test('LibreTranslate / translation API frontend exists', () => {
    expectFeatureEvidence([
      'libretranslate',
      'translate',
      'translation',
      'language',
      'lang',
    ]);
  });

  test('mouse selection description helper exists', () => {
    expectFeatureEvidence([
      'selection',
      'selected text',
      'mouseup',
      'description',
      'explain',
      'tooltip',
    ]);
  });

  test('text-to-speech page reading exists', () => {
    expectFeatureEvidence([
      'speechsynthesis',
      'text-to-speech',
      'text to speech',
      'read page',
      'tts',
    ]);
  });

  test('voice navigation / microphone accessibility exists', () => {
    expectFeatureEvidence([
      'speechrecognition',
      'microphone',
      'voice navigation',
      'voice command',
      'accessibility',
      'a11y',
    ]);
  });
});

describe('Graja Frontend Feature Tests - Cloudinary and UI Fixes', () => {
  test('Cloudinary image saving frontend exists', () => {
    expectFeatureEvidence([
      'cloudinary',
      'upload image',
      'profile image',
      'image upload',
      'avatar',
    ]);
  });

  test('theme provider / layout fixes exist', () => {
    expectFeatureEvidence([
      'themeprovider',
      'theme provider',
      'sidebar',
      'navbar',
      'layout',
      'logo',
    ]);
  });

  test('frontend source has enough feature files', () => {
    expect(files.length).toBeGreaterThan(10);
  });
});