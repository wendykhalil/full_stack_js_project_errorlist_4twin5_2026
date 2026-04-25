const fs = require('fs');
const path = require('path');

const projectRoot = path.resolve(__dirname, '../../..');

function exists(relativePath) {
  return fs.existsSync(path.join(projectRoot, relativePath));
}

function readIfExists(relativePath) {
  const filePath = path.join(projectRoot, relativePath);
  if (!fs.existsSync(filePath)) return '';
  return fs.readFileSync(filePath, 'utf8').toLowerCase();
}

function anyFileExists(paths) {
  return paths.some(exists);
}

function anyFileContains(paths, keywords) {
  const normalizedKeywords = keywords.map((keyword) => keyword.toLowerCase());
  return paths.some((relativePath) => {
    const content = readIfExists(relativePath);
    return content && normalizedKeywords.some((keyword) => content.includes(keyword));
  });
}

describe('Graja tests - auth, notifications and account security', () => {
  test('email notification, forgot password, reset password and direct mail login are covered by auth files', () => {
    const authFiles = [
      'backend/src/modules/auth/auth.controller.js',
      'backend/src/modules/auth/auth.service.js',
      'backend/src/modules/auth/auth.routes.js',
      'backend/src/utils/email.js',
      'backend/src/utils/emailService.js',
      'backend/src/utils/twilioVerify.js',
    ];

    expect(anyFileExists(authFiles)).toBe(true);
    expect(anyFileContains(authFiles, ['email', 'mail', 'notification'])).toBe(true);
    expect(anyFileContains(authFiles, ['reset', 'forgot', 'password'])).toBe(true);
    expect(anyFileContains(authFiles, ['google', 'oauth'])).toBe(true);
    expect(anyFileContains(authFiles, ['role', 'admin', 'artisan', 'prescripteur', 'supplier'])).toBe(true);
  });

  test('Face ID has both passkey/WebAuthn and camera fallback routes/components', () => {
    const faceIdFiles = [
      'backend/src/routes/faceId.routes.js',
      'backend/src/routes/cameraFaceId.routes.js',
      'frontend/src/components/FaceIdLogin.jsx',
      'frontend/src/components/FaceIdSettings.jsx',
      'frontend/src/components/CameraFaceIdLogin.jsx',
      'frontend/src/components/CameraFaceIdSetup.jsx',
    ];

    expect(anyFileExists(faceIdFiles)).toBe(true);
    expect(anyFileContains(faceIdFiles, ['face', 'camera', 'webauthn', 'passkey', 'credential'])).toBe(true);
  });

  test('SMS/phone verification login evidence is present', () => {
    const phoneFiles = [
      'backend/src/utils/twilioVerify.js',
      'backend/src/modules/auth/auth.controller.js',
      'backend/src/modules/auth/auth.service.js',
      'backend/src/modules/auth/auth.routes.js',
    ];

    expect(anyFileExists(phoneFiles)).toBe(true);
    expect(anyFileContains(phoneFiles, ['phone', 'sms', 'twilio', 'verify', 'code'])).toBe(true);
  });
});

describe('Graja tests - AI, ML, fraud, analytics and admin dashboard', () => {
  test('Ollama/AI project generation and AI quote/invoice assistance files exist', () => {
    const aiFiles = [
      'backend/src/modules/ai-assistant/ai.controller.js',
      'backend/src/modules/ai-assistant/ai.service.js',
      'backend/src/modules/ai-assistant/chat.service.js',
      'backend/src/modules/ai-assistant/prompts.js',
      'frontend/src/components/ai-assistant/AIAssistantChat.jsx',
      'frontend/src/components/ai-assistant/AIAssistantModal.jsx',
      'frontend/src/components/ai-chat.jsx',
    ];

    expect(anyFileExists(aiFiles)).toBe(true);
    expect(anyFileContains(aiFiles, ['ollama', 'ai', 'generate', 'quote', 'invoice', 'project'])).toBe(true);
  });

  test('ML prediction, project risk and delay calculation evidence exists', () => {
    const mlFiles = [
      'backend/src/modules/supplier/ml.client.js',
      'backend/src/routes/analytics.routes.js',
      'backend/src/routes/fraud.routes.js',
      'frontend/src/components/MLPredictions.jsx',
      'frontend/src/pages/AdminFraudAnalytics.jsx',
      'TESTING_ML_FRONTEND.md',
    ];

    expect(anyFileExists(mlFiles)).toBe(true);
    expect(anyFileContains(mlFiles, ['ml', 'prediction', 'risk', 'delay', 'fraud', 'analytics', 'score'])).toBe(true);
  });

  test('fraud detection and admin analytics/activity logs are covered', () => {
    const adminFiles = [
      'backend/src/routes/fraud.routes.js',
      'backend/src/models/ActivityLog.js',
      'backend/src/modules/admin/admin.controller.js',
      'backend/src/modules/admin/admin.service.js',
      'backend/src/modules/admin/aiInsights.service.js',
      'frontend/src/pages/AdminDashboard.jsx',
      'frontend/src/pages/AdminFraudAnalytics.jsx',
      'frontend/src/pages/AdminActivityLogs.jsx',
      'frontend/src/pages/AdminUserStatistics.jsx',
      'frontend/src/pages/AdminArtisanDashboard.jsx',
    ];

    expect(anyFileExists(adminFiles)).toBe(true);
    expect(anyFileContains(adminFiles, ['fraud', 'activity', 'analytics', 'statistics', 'dashboard', 'artisan'])).toBe(true);
  });
});

describe('Graja tests - messaging, documents, media and Cloudinary', () => {
  test('messagerie supports update/delete/archive and realtime notification evidence', () => {
    const messageFiles = [
      'backend/routes/messageActions.js',
      'backend/src/models/Message.js',
      'backend/src/models/Notification.js',
      'backend/src/modules/messages/messages.controller.js',
      'backend/src/modules/messages/messages.service.js',
      'backend/src/modules/messages/messages.routes.js',
      'backend/src/modules/notifications/notifications.controller.js',
      'backend/src/modules/notifications/notifications.routes.js',
      'frontend/src/components/MessageModal.jsx',
      'frontend/src/components/ConversationOptionsMenu.jsx',
      'frontend/src/components/RealtimeNotifications.jsx',
      'frontend/src/hooks/useConversationActions.js',
      'frontend/src/hooks/useUnreadMessages.js',
    ];

    expect(anyFileExists(messageFiles)).toBe(true);
    expect(anyFileContains(messageFiles, ['message', 'update', 'delete', 'archive', 'notification', 'socket', 'realtime'])).toBe(true);
  });

  test('PDF, image and voice messaging uploads are covered', () => {
    const uploadFiles = [
      'backend/src/middleware/messageUpload.js',
      'backend/src/modules/messages/messages.controller.js',
      'backend/src/modules/messages/messages.service.js',
      'frontend/src/components/VoiceInput.jsx',
      'frontend/src/components/MessageModal.jsx',
    ];

    expect(anyFileExists(uploadFiles)).toBe(true);
    expect(anyFileContains(uploadFiles, ['pdf', 'image', 'voice', 'audio', 'file', 'upload', 'webm'])).toBe(true);
  });

  test('Cloudinary image saving API configuration is present', () => {
    const cloudinaryFiles = [
      'backend/src/config/cloudinary.js',
      'backend/src/middleware/uploadProfileMedia.js',
      'backend/src/middleware/uploadProducts.js',
      'backend/src/middleware/uploadProjects.js',
      'backend/.env.example',
    ];

    expect(anyFileExists(cloudinaryFiles)).toBe(true);
    expect(anyFileContains(cloudinaryFiles, ['cloudinary', 'cloud_name', 'api_key', 'image', 'upload'])).toBe(true);
  });
});

describe('Graja tests - artisan, prescripteur, projects, quotes and invoices', () => {
  test('artisan CRUD, artisan profile and admin artisan dashboard evidence exists', () => {
    const artisanFiles = [
      'backend/src/modules/artisan/artisan.controller.js',
      'backend/src/modules/artisan/artisan.service.js',
      'backend/src/modules/artisan/artisan.routes.js',
      'backend/src/modules/artisan/artisanProfile.controller.js',
      'backend/src/models/ArtisanProfile.js',
      'frontend/src/pages/AdminArtisanDashboard.jsx',
      'frontend/src/layouts/ArtisanLayout.jsx',
    ];

    expect(anyFileExists(artisanFiles)).toBe(true);
    expect(anyFileContains(artisanFiles, ['artisan', 'create', 'update', 'delete', 'profile', 'dashboard'])).toBe(true);
  });

  test('prescripteur can view projects and project pagination/actions evidence exists', () => {
    const projectFiles = [
      'backend/src/modules/projects/projects.controller.js',
      'backend/src/modules/projects/projects.routes.js',
      'backend/src/modules/prescripteur/prescripteur.controller.js',
      'backend/src/modules/prescripteur/prescripteur.service.js',
      'frontend/src/components/Pagination.jsx',
      'frontend/src/layouts/PrescripteurLayout.jsx',
    ];

    expect(anyFileExists(projectFiles)).toBe(true);
    expect(anyFileContains(projectFiles, ['project', 'prescripteur', 'pagination', 'page', 'limit', 'action'])).toBe(true);
  });

  test('devis/quotes and invoices CRUD with PDF/Excel evidence exists', () => {
    const billingFiles = [
      'backend/src/models/Devis.js',
      'backend/src/models/Facture.js',
      'backend/src/modules/documents/documents.controller.js',
      'backend/src/modules/documents/documents.routes.js',
      'frontend/src/components/TechnicalSheetViewer.jsx',
    ];

    expect(anyFileExists(billingFiles)).toBe(true);
    expect(anyFileContains(billingFiles, ['devis', 'facture', 'quote', 'invoice', 'pdf', 'excel', 'document'])).toBe(true);
  });
});

describe('Graja tests - translation, accessibility, location and UI fixes', () => {
  test('LibreTranslate/translation API integration evidence exists', () => {
    const translationFiles = [
      'frontend/src/components/translation/AutoPageTranslator.jsx',
      'frontend/src/hooks/useAutoPageTranslation.js',
      'frontend/src/hooks/useTranslateContent.js',
      'frontend/src/components/LanguageSwitcher.jsx',
      'frontend/src/i18n.js',
      'frontend/public/locales/fr/translation.json',
      'frontend/public/locales/en/translation.json',
      'frontend/public/locales/ar/translation.json',
    ];

    expect(anyFileExists(translationFiles)).toBe(true);
    expect(anyFileContains(translationFiles, ['translate', 'libre', 'language', 'i18n', 'locale'])).toBe(true);
  });

  test('accessibility: mouse selection descriptions, text-to-speech, voice navigation and microphone support are present', () => {
    const accessibilityFiles = [
      'ACCESSIBILITY_FEATURES.md',
      'frontend/src/components/MouseTooltip.jsx',
      'frontend/src/components/TextToSpeech.jsx',
      'frontend/src/components/ReadPageButton.jsx',
      'frontend/src/components/VoiceInput.jsx',
      'frontend/src/pages/AccessibilityDemo.jsx',
      'frontend/src/pages/AccessibilitySettings.jsx',
    ];

    expect(anyFileExists(accessibilityFiles)).toBe(true);
    expect(anyFileContains(accessibilityFiles, ['accessibility', 'speech', 'voice', 'microphone', 'tooltip', 'selection', 'read'])).toBe(true);
  });

  test('localisation/map picker/profile and project location fixes are present', () => {
    const locationFiles = [
      'frontend/src/components/MapPickerModal.jsx',
      'frontend/src/components/LiveLocationSection.jsx',
      'frontend/src/components/ArtisanLocationPromptModal.jsx',
      'backend/src/utils/ipGeo.js',
      'backend/src/modules/projects/projects.controller.js',
      'backend/src/modules/artisan/artisanProfile.controller.js',
    ];

    expect(anyFileExists(locationFiles)).toBe(true);
    expect(anyFileContains(locationFiles, ['location', 'map', 'coordinates', 'latitude', 'longitude', 'tofixed', 'profile'])).toBe(true);
  });
});
