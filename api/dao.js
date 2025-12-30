const kv = require('./db');
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

  await kv.set(`paste:${id}`, pasteData);
  return id;
}

async function getPaste(id, req) {
  const paste = await kv.get(`paste:${id}`);
  if (!paste) return null;

  const now = getCurrentTime(req);
  if (paste.expires_at_ms && now > paste.expires_at_ms) return null;
  if (paste.max_views !== null && paste.views_used >= paste.max_views) return null;

  paste.views_used += 1;
  await kv.set(`paste:${id}`, paste);

  return paste;
}

module.exports = { createPaste, getPaste };