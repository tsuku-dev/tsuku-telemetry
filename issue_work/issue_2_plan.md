# Issue 2 Implementation Plan

## Summary
Integrate Cloudflare Analytics Engine for storing telemetry events, with proper validation, CORS headers, and testing.

## Approach
Follow the implementation pattern from docs/DESIGN.md, adding the Env interface for Analytics Engine binding, event validation, and CORS support.

### Alternatives Considered
- Direct Analytics Engine queries in tests: Not feasible as Analytics Engine isn't available in test environment. Tests will verify routing and validation only.

## Files to Modify
- `src/index.ts` - Add Env interface, Analytics Engine integration, validation, CORS headers
- `src/index.test.ts` - Add tests for validation and CORS
- `wrangler.toml` - Add Analytics Engine binding

## Implementation Steps
- [x] Add Analytics Engine binding to wrangler.toml
- [x] Add Env interface and update worker signature in src/index.ts
- [x] Add CORS headers to all responses
- [x] Add OPTIONS handler for CORS preflight
- [x] Add event validation (require recipe and action fields)
- [x] Add Analytics Engine writeDataPoint call
- [x] Update tests for validation (400 for invalid events)
- [x] Add tests for CORS headers
- [x] Verify all tests pass

## Testing Strategy
- Unit tests: Verify validation returns 400 for missing fields
- Unit tests: Verify CORS headers present on responses
- Manual verification: Local `npx wrangler dev` testing with curl

## Risks and Mitigations
- Analytics Engine binding not available in test environment: Mock not needed, writeDataPoint is fire-and-forget
- Analytics Engine API changes: Use types from @cloudflare/workers-types

## Success Criteria
- [x] POST /event validates required fields (recipe, action)
- [x] POST /event returns 400 for invalid JSON
- [x] POST /event returns 400 for missing required fields
- [x] All responses include CORS headers
- [x] OPTIONS requests handled for CORS preflight
- [x] wrangler.toml includes Analytics Engine binding
- [x] All tests pass

## Open Questions
None - requirements are clear from issue and design doc.
