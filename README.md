# PasteBin Project 📝

A simple pastebin service to share text snippets temporarily. Create a paste, get a unique URL, and share it with others. Done.

## What It Does

- **Create pastes** - Post some text and get a shareable link
- **Set expiry** - Pastes can expire after a set time (in seconds)
- **Limit views** - Pastes can automatically delete after being viewed X times
- **Simple UI** - A basic web form to create and view pastes

## Tech Stack

- **Express.js** - Web server
- **Redis** - Data storage (using ioredis)
- **Node.js** - Runtime
- **Vercel** - Hosting/deployment

## Quick Start

### Prerequisites

- Node.js (v18 or higher)
- Redis instance (we're using Redis Labs)

### Installation

```bash
npm install
```

### Environment Setup

Create a `.env` file with your Redis connection:

```
REDIS_URL="redis://user:password@host:port"
TEST_MODE=0
```

### Running Locally

```bash
node api/index.js
```

Server will run on `http://localhost:3000`

## API Endpoints

### Create a Paste

```
POST /api/pastes
```

Body:

```json
{
  "content": "Your text here",
  "ttl_seconds": 3600,
  "max_views": 5
}
```

Response:

```json
{
  "id": "uuid-here",
  "url": "https://yoursite.com/p/uuid-here"
}
```

### View a Paste

```
GET /p/:id
```

Returns an HTML page with the paste content displayed.

### Health Check

```
GET /api/healthz
```

## Features

- ✅ UUID-based paste IDs
- ✅ TTL support (pastes expire automatically)
- ✅ View limit support (pastes delete after N views)
- ✅ HTML rendering for easy viewing
- ✅ Simple web interface
- ✅ CORS enabled
- ✅ Test mode for time manipulation

## Deployment

This project is configured for Vercel. Just push to your repo and it'll deploy automatically. The `vercel.json` handles routing.

## Notes

- Pastes are stored in Redis, not a database
- No authentication - this is meant for temporary sharing
- Content is HTML-escaped for safety
- Test mode allows overriding timestamps (header: `x-test-now-ms`)
