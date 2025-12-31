# PasteBin Project

A simple Pastebin-like service for sharing text snippets temporarily, with optional
time-based expiration (TTL) and view limits.

The application is designed to be stateless and is backed by Redis for persistence,
making it suitable for serverless deployment.

## Deployed URL

https://paste-bin-project-ajdjlarc2-krish561s-projects.vercel.app/

## Running Locally

### Prerequisites

- Node.js v18+
- A Redis instance (local or hosted, e.g. Upstash)

### Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create a .env file in the root directory:

```env
REDIS_URL=redis://user:password@host:port
TEST_MODE=0
```

3. Start the server:

```bash
node index.js
```

The app will run on http://localhost:3000.
API Overview

    POST /api/pastes
    Create a new paste with optional ttl_seconds and max_views.

    GET /api/pastes/:id
    Fetch a paste as JSON. Each successful fetch counts as a view and decrements
    the remaining view count.

    GET /p/:id
    Render the paste as an HTML page with escaped content for safe viewing.

    GET /api/healthz
    Health check endpoint to verify server and Redis connectivity.

Persistence Layer

Redis is used as the persistence layer via the ioredis client.

Each paste is stored as a JSON object using the key format paste:{id} with fields:

    id – UUID identifier

    content – Text content of the paste

    created_at – Creation timestamp (ms)

    expires_at – Expiration timestamp (ms), if TTL is set

    remaining_views – Remaining allowed views, if a view limit is set

Expiration is enforced in two ways:

    Logical checks at read time (TTL and view limits)

    Redis key TTL as a safety mechanism to ensure eventual cleanup

Design Decisions

    UUID-based IDs - Random UUIDs are used instead of sequential IDs to prevent easy guessing
    of valid paste URLs.

    Atomic View Decrementing - View limits are enforced atomically in Redis to prevent race conditions
    under concurrent access.

    Server-Side Expiry Logic - Expiry is checked when pastes are accessed, allowing consistent enforcement
    of both time-based and view-based limits.

    Safe HTML Rendering - Paste content is escaped before rendering to prevent XSS attacks.

    Test Mode Support - When TEST_MODE=1, the x-test-now-ms header can be used to override the
    current time, enabling deterministic testing of TTL behavior.

    Stateless Architecture - All state is stored in Redis, allowing the application to scale horizontally
    and run reliably in a serverless environment (Vercel).
