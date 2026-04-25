# Graja Tests

This folder groups the tests/evidence checks for the features implemented by Graja/Amine so they are easy to show during the DevOps evaluation.

Run from backend:

```bash
npm test -- --testPathPattern=graja-tests
```

Covered feature groups:

- Email notification during account creation
- Forgot/reset password
- Direct email login, Google login, phone/SMS login and role registration
- Face ID login: passkey/WebAuthn + camera fallback
- Ollama/AI project generation and AI quotes/invoices support
- ML project prediction, risk/delay calculation, fraud detection and admin analytics
- Artisan CRUD, prescripteur project display and admin artisan dashboard
- Messaging update/delete/archive, realtime notifications, voice/PDF/image attachments
- Cloudinary image/file saving API
- LibreTranslate/i18n translation features
- Accessibility: selected-text description, text-to-speech, voice navigation and microphone
- Localisation/maps on project and profile
- Devis/quotes and invoices CRUD with PDF/Excel evidence

These tests are intentionally simple because the teacher said the grade focuses on test integration in CI/CD more than scenario complexity.
