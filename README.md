# page-meta-proxy

A Cloudflare Workers API that extracts meta information from web pages using streaming HTML parsing with HTMLRewriter.

## Features

- Streaming meta extraction using Cloudflare's HTMLRewriter
- OpenAPI schema with Zod validation
- Normalized fields for common meta tags
- Extracts OG, Twitter, and standard meta tags
- Resolves relative URLs to absolute URLs
- Loop detection to prevent infinite recursion

## API

### `GET /meta?url=<url>`

Extracts meta information from the specified URL.

**Response fields:**

| Field | Description |
|-------|-------------|
| `title` | Page title from `<title>` |
| `description` | From `meta[name=description]` or `og:description` |
| `canonical` | From `<link rel="canonical">` |
| `lang` | From `<html lang="...">` |
| `charset` | From `<meta charset="...">` |
| `favicon` | Primary favicon URL |
| `themeColor` | From `meta[name=theme-color]` |
| `author` | From `meta[name=author]` |
| `keywords` | From `meta[name=keywords]` |
| `robots` | From `meta[name=robots]` |
| `generator` | From `meta[name=generator]` |
| `og` | Open Graph properties as `{ title, description, image, ... }` |
| `twitter` | Twitter Card properties as `{ card, title, ... }` |
| `icons` | Array of all icon links (favicon, apple-touch-icon, etc.) |
| `alternates` | Array of alternate links (hreflang, RSS feeds, etc.) |
| `metaByName` | Map of all `meta[name=*]` |
| `metaByProperty` | Map of all `meta[property=*]` |
| `metaTags` | Raw array of all meta tags |
| `linkTags` | Raw array of all link tags |

### `GET /doc`

Returns OpenAPI 3.0 specification.

## Development

```bash
# Install dependencies
pnpm install

# Start dev server
pnpm dev

# Run tests
pnpm test

# Lint
pnpm lint

# Format
pnpm format

# Deploy to Cloudflare Workers
pnpm deploy
```

## Tech Stack

- [Hono](https://hono.dev/) - Web framework
- [@hono/zod-openapi](https://github.com/honojs/middleware/tree/main/packages/zod-openapi) - OpenAPI schema generation
- [Cloudflare Workers](https://workers.cloudflare.com/) - Runtime
- [HTMLRewriter](https://developers.cloudflare.com/workers/runtime-apis/html-rewriter/) - Streaming HTML parsing
- [Vitest](https://vitest.dev/) + [@cloudflare/vitest-pool-workers](https://developers.cloudflare.com/workers/testing/vitest-integration/) - Testing

## License

MIT
