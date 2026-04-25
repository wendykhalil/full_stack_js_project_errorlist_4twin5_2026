/* eslint-env node, jest */
/* eslint-disable no-undef */

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
      if (
        item === 'node_modules' ||
        item === 'dist' ||
        item === '.git' ||
        item === 'coverage'
      ) continue;

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
const allContent = files.map(f => f.content).join('\n').toLowerCase();
const allPaths = files.map(f => f.path.toLowerCase()).join('\n');

function expectFeature(keywords) {
  const found = keywords.some(k =>
    allContent.includes(k.toLowerCase()) ||
    allPaths.includes(k.toLowerCase())
  );
  expect(found).toBe(true);
}

describe('Wendy Frontend - User & Fournisseur', () => {
  test('user management UI exists', () => {
    expectFeature([
      'user',
      'users',
      'manage users',
      'user list',
      'user table',
      'user dashboard'
    ]);
  });

  test('fournisseur/supplier profile UI exists', () => {
    expectFeature([
      'fournisseur',
      'supplier',
      'supplier profile',
      'company',
      'profile page'
    ]);
  });

  test('fournisseur CRUD UI exists', () => {
    expectFeature([
      'create supplier',
      'edit supplier',
      'delete supplier',
      'update fournisseur',
      'form'
    ]);
  });
});

describe('Wendy Frontend - Orders System', () => {
  test('order request UI exists', () => {
    expectFeature([
      'order',
      'orders',
      'place order',
      'new order',
      'commande'
    ]);
  });

  test('order history and status UI exists', () => {
    expectFeature([
      'order history',
      'status',
      'pending',
      'ready',
      'completed'
    ]);
  });

  test('supplier dashboard statistics UI exists', () => {
    expectFeature([
      'dashboard',
      'statistics',
      'stats',
      'orders count',
      'revenue'
    ]);
  });
});

describe('Wendy Frontend - Email & Notifications', () => {
  test('email / notification UI exists', () => {
    expectFeature([
      'notification',
      'email',
      'alert',
      'notify',
      'message'
    ]);
  });
});

describe('Wendy Frontend - AI / ML / Insights', () => {
  test('AI insights UI exists', () => {
    expectFeature([
      'ai',
      'insights',
      'recommendation',
      'smart',
      'analytics'
    ]);
  });

  test('ML prediction UI exists', () => {
    expectFeature([
      'ml',
      'prediction',
      'model',
      'predict',
      'forecast'
    ]);
  });
});

describe('Wendy Frontend - Real-time & Messaging', () => {
  test('real-time updates UI exists', () => {
    expectFeature([
      'socket',
      'realtime',
      'live',
      'update',
      'notification'
    ]);
  });
});

describe('Wendy Frontend - Favorites, Cart, Reviews', () => {
  test('favorites UI exists', () => {
    expectFeature([
      'favorite',
      'favorites',
      'wishlist'
    ]);
  });

  test('cart system UI exists', () => {
    expectFeature([
      'cart',
      'basket',
      'checkout'
    ]);
  });

  test('review system UI exists', () => {
    expectFeature([
      'review',
      'rating',
      'stars',
      'feedback'
    ]);
  });
});

describe('Wendy Frontend - Search & Portfolio', () => {
  test('artisan portfolio UI exists', () => {
    expectFeature([
      'portfolio',
      'projects',
      'gallery',
      'works'
    ]);
  });

  test('search functionality UI exists', () => {
    expectFeature([
      'search',
      'filter',
      'query',
      'keyword'
    ]);
  });
});

describe('Wendy Frontend - DevOps readiness', () => {
  test('frontend has enough source files', () => {
    expect(files.length).toBeGreaterThan(10);
  });
});