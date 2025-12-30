# PasteBin Project

A simple pastebin service for sharing text snippets temporarily with optional expiry and view limits.

## Running Locally

### Prerequisites

- Node.js v18+
- A Redis instance (you can use Redis Labs or a local Redis server)

### Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create a `.env` file in the root directory:

   ```
   REDIS_URL="redis://user:password@host:port"
   TEST_MODE=0
   ```

3. Start the server:
   ```bash
   node api/index.js
   ```

The app will run on `http://localhost:3000`

## Persistence Layer

**Redis** is used for all data storage via the `ioredis` client.

Each paste is stored as a JSON object with the key format `paste:{id}`:

- `content` - The text content
- `created_at` - Timestamp when created
- `expires_at_ms` - When the paste expires (if TTL was set)
- `max_views` - Maximum allowed views (if set)
- `views_used` - Current view count

The data is stored as stringified JSON in Redis and parsed on retrieval. No expiry is set on the Redis key itself—expiration is checked at read time (TTL-based and view-limit-based).

## Design Decisions

1. **UUID for Paste IDs** - Each paste gets a random UUID rather than sequential IDs, making it harder to guess valid paste URLs.

2. **Server-Side Expiry Checks** - Instead of relying on Redis TTL, expiry is checked when the paste is retrieved. This allows supporting both time-based TTL and view-count limits with a single approach.

3. **Simple HTML Rendering** - Pastes are returned as HTML pages with escaped content for security, not as JSON APIs. Makes sharing and viewing simple.

4. **No Database** - Redis is ideal here—fast key-value access without the overhead of a database. Perfect for temporary, short-lived data.

5. **Test Mode Support** - The `TEST_MODE` environment variable and `x-test-now-ms` header allow overriding the current time for testing expiry logic.

6. **Stateless Design** - The server can be scaled horizontally since all state is in Redis. Useful for serverless deployments (Vercel).
