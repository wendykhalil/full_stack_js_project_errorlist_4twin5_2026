/**
 * Job: auto-cancel OPEN service requests whose deadline has passed.
 * Runs on an interval set by EXPIRE_SR_INTERVAL_MS (default: every hour).
 * Safe to call multiple times — uses $lt: now so already-cancelled docs are skipped.
 */
const mongoose = require('mongoose');
const ServiceRequest = require('../models/ServiceRequest');

async function expireServiceRequests() {
  try {
    // ✅ FIX: Check if MongoDB is connected before running query
    if (mongoose.connection.readyState !== 1) {
      console.warn('[expireServiceRequests] Skipping - MongoDB not connected yet');
      return;
    }

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
  
  // ✅ FIX: Don't run immediately - wait for first interval
  // This ensures MongoDB connection is established first
  setInterval(expireServiceRequests, intervalMs);
  console.log(`[expireServiceRequests] Job started — interval: ${intervalMs / 1000}s`);
  console.log('[expireServiceRequests] First run will occur after interval delay');
}

module.exports = { startExpireJob, expireServiceRequests };
