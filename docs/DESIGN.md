# tsuku-telemetry Design

## Overview

Cloudflare Worker that receives telemetry events from tsuku CLI and stores them in Cloudflare Analytics Engine.

## Architecture

```
┌─────────────┐     ┌──────────────────────────┐     ┌─────────────────┐
│ tsuku CLI   │────▶│ telemetry.tsuku.dev      │────▶│ Analytics Engine│
│             │     │ (Cloudflare Worker)      │     │                 │
└─────────────┘     └──────────────────────────┘     └─────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │ /stats endpoint  │
                    │ (aggregated JSON)│
                    └──────────────────┘
```

## Repository Structure

```
tsuku-telemetry/
├── src/
│   └── index.ts          # Worker code
├── wrangler.toml         # Cloudflare config
├── package.json
├── tsconfig.json
├── README.md
└── .github/
    └── workflows/
        └── deploy.yml    # Auto-deploy on push to main
```

## Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/event` | POST | Receive telemetry events from CLI |
| `/stats` | GET | Return aggregated public statistics |
| `/stats/recipe/:name` | GET | Stats for specific recipe |
| `/health` | GET | Health check |

## Event Schema

```typescript
interface TelemetryEvent {
  recipe: string;         // required - e.g., "nodejs"
  version: string;        // optional - e.g., "22.0.0"
  os: string;             // optional - e.g., "linux"
  arch: string;           // optional - e.g., "amd64"
  tsuku_version: string;  // optional - e.g., "0.3.0"
  action: string;         // required - "install" | "update" | "remove"
}
```

## Stats Response Format

```json
{
  "generated_at": "2024-11-27T12:00:00Z",
  "period": "last_30_days",
  "total_installs": 15234,
  "recipes": [
    { "name": "nodejs", "installs": 2341, "updates": 123 },
    { "name": "terraform", "installs": 1892, "updates": 89 },
    { "name": "kubectl", "installs": 1654, "updates": 201 }
  ],
  "by_os": {
    "linux": 12000,
    "darwin": 3234
  },
  "by_arch": {
    "amd64": 14000,
    "arm64": 1234
  }
}
```

## Cloudflare Configuration

```toml
# wrangler.toml
name = "tsuku-telemetry"
main = "src/index.ts"
compatibility_date = "2024-01-01"

routes = [
  { pattern = "telemetry.tsuku.dev", custom_domain = true }
]

[[analytics_engine_datasets]]
binding = "ANALYTICS"
dataset = "tsuku_telemetry"
```

## Worker Implementation

```typescript
export interface Env {
  ANALYTICS: AnalyticsEngineDataset;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    // POST /event - receive telemetry
    if (request.method === "POST" && url.pathname === "/event") {
      try {
        const event = await request.json();

        if (!event.recipe || !event.action) {
          return new Response("Bad request", { status: 400 });
        }

        env.ANALYTICS.writeDataPoint({
          blobs: [
            event.recipe,
            event.version || "unknown",
            event.os || "unknown",
            event.arch || "unknown",
            event.tsuku_version || "unknown",
            event.action,
          ],
          indexes: [event.recipe],
        });

        return new Response("ok", { headers: corsHeaders });
      } catch {
        return new Response("Bad request", { status: 400 });
      }
    }

    // GET /stats - public aggregated stats
    if (request.method === "GET" && url.pathname === "/stats") {
      // Query Analytics Engine for aggregates
      return new Response(JSON.stringify({ status: "ok" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // GET /health
    if (url.pathname === "/health") {
      return new Response("ok", { headers: corsHeaders });
    }

    return new Response("Not found", { status: 404 });
  },
};
```

## Deployment

### GitHub Actions

```yaml
name: Deploy
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
```

### Manual

```bash
npx wrangler deploy
```

## DNS Setup

Add CNAME record in Cloudflare DNS for tsuku.dev:
```
telemetry.tsuku.dev → tsuku-telemetry.workers.dev
```

## Security Considerations

- No authentication required (public write endpoint)
- Rate limiting handled by Cloudflare automatically
- No PII stored
- Analytics Engine handles data retention
- CORS enabled for stats endpoint (browser access)

## Cost

| Tier | Requests/Month | Cost |
|------|----------------|------|
| Free | Up to 100K/day | $0 |
| Paid | Unlimited | $5/month base |
