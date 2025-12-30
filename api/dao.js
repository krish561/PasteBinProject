// api/dao.js
const redis = require('./db');
const { v4: uuidv4 } = require('uuid');

function getCurrentTime(req) {
  if (process.env.TEST_MODE === '1' && req.headers['x-test-now-ms']) {
    return parseInt(req.headers['x-test-now-ms'], 10);
  }
  return Date.now();
}

async function createPaste(content, ttl_seconds, max_views, req) {
  const id = uuidv4();
  const now = getCurrentTime(req);
  
  const pasteData = {
    content,
    created_at: now,
    max_views: max_views ? parseInt(max_views) : null,
    views_used: 0,
    expires_at_ms: ttl_seconds ? now + (ttl_seconds * 1000) : null
  };

  // CHANGE: We must stringify the JSON before saving to Redis
  await redis.set(`paste:${id}`, JSON.stringify(pasteData));
  return id;
}

async function getPaste(id, req) {
  // CHANGE: We get a string back, so we must parse it
  const dataString = await redis.get(`paste:${id}`);
  if (!dataString) return null;

  const paste = JSON.parse(dataString);
  const now = getCurrentTime(req);

  // Check 1: Time Expiry
  if (paste.expires_at_ms && now > paste.expires_at_ms) return null;

  // Check 2: View Limit
  if (paste.max_views !== null && paste.views_used >= paste.max_views) return null;

  // Increment views and save back
  paste.views_used += 1;
  
  // CHANGE: Stringify again to save updates
  await redis.set(`paste:${id}`, JSON.stringify(paste));

  return paste;
}

module.exports = { createPaste, getPaste };
