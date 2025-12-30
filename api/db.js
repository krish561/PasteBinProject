require('dotenv').config();
const { createClient } = require('@vercel/kv');

// We use the standard KV client which works with both REST and local modes
const kv = createClient({
  url: process.env.KV_REST_API_URL,
  token: process.env.KV_REST_API_TOKEN,
});

module.exports = kv;