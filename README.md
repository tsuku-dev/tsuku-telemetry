# tsuku-telemetry

[![Tests](https://github.com/tsuku-dev/tsuku-telemetry/actions/workflows/ci.yml/badge.svg)](https://github.com/tsuku-dev/tsuku-telemetry/actions/workflows/ci.yml)
[![codecov](https://codecov.io/gh/tsuku-dev/tsuku-telemetry/graph/badge.svg)](https://codecov.io/gh/tsuku-dev/tsuku-telemetry)

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

# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Deploy
npx wrangler deploy
```

## Related

- [tsuku](https://github.com/tsuku-dev/tsuku) - CLI tool
- [tsuku.dev](https://github.com/tsuku-dev/tsuku.dev) - Website with stats dashboard
