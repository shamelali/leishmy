# URL Shortener Worker

A Cloudflare Worker that shortens URLs, tracks analytics, supports custom short codes, and rate-limits by IP.

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/shorten` | Create a short URL |
| GET | `/{code}` | Redirect to original URL (302) |
| GET | `/api/stats/{code}` | Get analytics for a short URL |
| GET | `/` | Health check |

## Usage

### Shorten a URL

```bash
curl -X POST https://your-worker.workers.dev/api/shorten \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com/very/long/path"}'
```

Response (201):
```json
{
  "shortCode": "aB3x9z",
  "shortUrl": "https://your-worker.workers.dev/aB3x9z",
  "url": "https://example.com/very/long/path"
}
```

### Shorten with a custom code

```bash
curl -X POST https://your-worker.workers.dev/api/shorten \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com", "customCode": "my-link"}'
```

### Redirect (follow the short URL)

```bash
curl -v https://your-worker.workers.dev/aB3x9z
# Returns 302 with Location header pointing to the original URL
```

### Get analytics

```bash
curl https://your-worker.workers.dev/api/stats/aB3x9z
```

Response (200):
```json
{
  "shortCode": "aB3x9z",
  "totalClicks": 42,
  "recentClicks": [
    {
      "timestamp": "2025-07-27T12:00:00.000Z",
      "referer": "https://google.com",
      "userAgent": "Mozilla/5.0 ...",
      "country": "US"
    }
  ]
}
```

## Rate Limiting

10 requests per minute per IP address. Returns `429 Too Many Requests` with a `Retry-After` header when exceeded.

## Setup

1. Create two KV namespaces in your Cloudflare account (URL_MAP and ANALYTICS)
2. Replace the placeholder IDs in `wrangler.jsonc` with your real namespace IDs
3. Deploy with `wrangler deploy` or `wrangler publish`

## Local Testing

```bash
wrangler dev
```

Then test locally:
```bash
curl -X POST http://localhost:8787/api/shorten \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com"}'
```