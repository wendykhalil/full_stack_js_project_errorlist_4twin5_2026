/**
 * Job: auto-cancel OPEN service requests whose deadline has passed.
 * Runs on an interval set by EXPIRE_SR_INTERVAL_MS (default: every hour).
 * Safe to call multiple times — uses $lt: now so already-cancelled docs are skipped.
 */
const ServiceRequest = require('../models/ServiceRequest');

async function expireServiceRequests() {
  try {
    const now = new Date();
    const result = await ServiceRequest.updateMany(
      {
        status: 'OPEN',
        deadline: { $lt: now, $ne: null },
      },
      { $set: { status: 'CANCELLED' } }
    );
    if (result.modifiedCount > 0) {
      console.log(`[expireServiceRequests] Auto-cancelled ${result.modifiedCount} expired request(s)`);
    }
  } catch (err) {
    console.error('[expireServiceRequests] Error:', err.message);
  }
}

function startExpireJob() {
  const intervalMs = Number(process.env.EXPIRE_SR_INTERVAL_MS) || 60 * 60 * 1000; // default 1h
  // Run once immediately on startup, then on interval
  expireServiceRequests();
  setInterval(expireServiceRequests, intervalMs);
  console.log(`[expireServiceRequests] Job started — interval: ${intervalMs / 1000}s`);
}

module.exports = { startExpireJob, expireServiceRequests };
