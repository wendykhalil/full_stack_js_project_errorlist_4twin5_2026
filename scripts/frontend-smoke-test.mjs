import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const src = join(root, 'src');
const checks = [
  ['React entry point', join(src, 'main.jsx')],
  ['App component', join(src, 'App.jsx')],
  ['Face ID login UI', join(src, 'components', 'FaceIdLogin.jsx')],
  ['Camera Face ID login UI', join(src, 'components', 'CameraFaceIdLogin.jsx')],
  ['Translation switcher', join(src, 'components', 'LanguageSwitcher.jsx')],
  ['Accessibility controls', join(src, 'components', 'AccessibilityControls.jsx')],
  ['Realtime notifications', join(src, 'components', 'RealtimeNotifications.jsx')],
  ['ML predictions', join(src, 'components', 'MLPredictions.jsx')],
  ['Map picker', join(src, 'components', 'MapPickerModal.jsx')],
];

const missing = checks.filter(([, file]) => !existsSync(file));
if (missing.length) {
  console.error('Missing expected frontend files:');
  for (const [name, file] of missing) console.error(`- ${name}: ${file}`);
  process.exit(1);
}

const app = readFileSync(join(src, 'App.jsx'), 'utf8');
const expectedHints = ['Route', 'Login'];
for (const hint of expectedHints) {
  if (!app.includes(hint)) {
    console.error(`Expected App.jsx to contain ${hint}`);
    process.exit(1);
  }
}

console.log('Frontend smoke tests passed: core features are present.');
