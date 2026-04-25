const fs = require('fs');
const path = require('path');

const projectRoot = path.resolve(__dirname, '../../..');

function exists(relativePath) {
  return fs.existsSync(path.join(projectRoot, relativePath));
}

describe('DevOps feature evidence coverage', () => {
  test('core authentication and notification modules exist', () => {
    const expected = [
      'backend/src',
      'backend/tests/unit/auth.service.test.js',
      'backend/tests/unit/notify.util.test.js',
      'backend/tests/unit/messages.controller.test.js'
    ];
    expected.forEach((file) => expect(exists(file)).toBe(true));
  });

  test('AI, ML, messaging and Cloudinary related project assets exist', () => {
    const expected = [
      'ml-service/app.py',
      'ml-service/fraud_detection.py',
      'ml-service/smart_analytics.py',
      'backend/tests/unit/messages.service.test.js',
      'backend/tests/unit/projects.controller.test.js'
    ];
    expected.forEach((file) => expect(exists(file)).toBe(true));
  });

  test('DevOps assets required by teacher are present', () => {
    const expected = [
      '.github/workflows/ci-backend.yml',
      '.github/workflows/cd-backend.yml',
      '.github/workflows/ci-frontend.yml',
      '.github/workflows/cd-frontend.yml',
      'devops/k8s/backend-deployment.yml',
      'devops/k8s/frontend-deployment.yml',
      'devops/monitoring/prometheus/prometheus.yml',
      'devops/monitoring/alertmanager/alertmanager.yml',
      'docs/devops/TEACHER_REQUIREMENTS_CHECKLIST.md'
    ];
    expected.forEach((file) => expect(exists(file)).toBe(true));
  });
});
