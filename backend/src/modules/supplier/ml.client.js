/**
 * ml.client.js
 * Thin HTTP client that talks to the Python ML microservice.
 */

const ML_BASE_URL = process.env.ML_SERVICE_URL || 'http://localhost:5001';
const TIMEOUT_MS  = 8000;
const RETRAIN_TIMEOUT_MS = 60000; // retraining can take longer

/**
 * Send a batch of products to the ML service for classification.
 */
async function predictBatch(products) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(`${ML_BASE_URL}/predict-batch`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ products }),
      signal:  controller.signal,
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`ML service responded ${res.status}: ${text.slice(0, 200)}`);
    }

    const data = await res.json();
    return data.results || [];
  } catch (err) {
    if (err.name === 'AbortError') throw new Error('ML service timed out');
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Trigger model retraining with live product data.
 *
 * @param {Array<{ price, stock, orders, rating }>} products
 * @returns {Promise<{ status, message, samples_used, accuracy, lastTrainedAt }>}
 */
async function retrainModel(products) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), RETRAIN_TIMEOUT_MS);

  try {
    const res = await fetch(`${ML_BASE_URL}/retrain`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ products }),
      signal:  controller.signal,
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || `ML retrain failed (${res.status})`);
    }

    return data;
  } catch (err) {
    if (err.name === 'AbortError') throw new Error('ML retrain timed out (>60s)');
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Fetch last training metadata from the ML service.
 * @returns {Promise<{ lastTrainedAt, samplesUsed, accuracy } | null>}
 */
async function getModelMeta() {
  try {
    const res = await fetch(`${ML_BASE_URL}/meta`, {
      signal: AbortSignal.timeout(3000),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.meta || null;
  } catch {
    return null;
  }
}

/**
 * Check if the ML service is reachable.
 */
async function isHealthy() {
  try {
    const res = await fetch(`${ML_BASE_URL}/health`, {
      signal: AbortSignal.timeout(3000),
    });
    return res.ok;
  } catch {
    return false;
  }
}

module.exports = { predictBatch, retrainModel, getModelMeta, isHealthy };
