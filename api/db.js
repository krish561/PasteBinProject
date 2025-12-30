require('dotenv').config();
const Redis = require('ioredis');

// Connecting to REDIS_URL 
const redis = new Redis(process.env.REDIS_URL);

module.exports = redis;
