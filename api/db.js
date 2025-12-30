// api/db.js
require('dotenv').config();
const Redis = require('ioredis');

// Connect using the REDIS_URL you confirmed you have
const redis = new Redis(process.env.REDIS_URL);

module.exports = redis;
