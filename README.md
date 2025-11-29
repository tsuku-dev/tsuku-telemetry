# tsuku-telemetry

Cloudflare Worker for receiving and aggregating tsuku usage telemetry.

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

## Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/event` | POST | Receive telemetry events from CLI |
| `/stats` | GET | Return aggregated public statistics |
| `/health` | GET | Health check |

## Development

```bash
# Install dependencies
npm install

# Run locally
npx wrangler dev

# Deploy
npx wrangler deploy
```

## Related

- [tsuku](https://github.com/tsuku-dev/tsuku) - CLI tool
- [tsuku.dev](https://github.com/tsuku-dev/tsuku.dev) - Website with stats dashboard
