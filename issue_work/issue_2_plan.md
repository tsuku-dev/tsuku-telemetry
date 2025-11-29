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
- [ ] Add Analytics Engine binding to wrangler.toml
- [ ] Add Env interface and update worker signature in src/index.ts
- [ ] Add CORS headers to all responses
- [ ] Add OPTIONS handler for CORS preflight
- [ ] Add event validation (require recipe and action fields)
- [ ] Add Analytics Engine writeDataPoint call
- [ ] Update tests for validation (400 for invalid events)
- [ ] Add tests for CORS headers
- [ ] Verify all tests pass

## Testing Strategy
- Unit tests: Verify validation returns 400 for missing fields
- Unit tests: Verify CORS headers present on responses
- Manual verification: Local `npx wrangler dev` testing with curl

## Risks and Mitigations
- Analytics Engine binding not available in test environment: Mock not needed, writeDataPoint is fire-and-forget
- Analytics Engine API changes: Use types from @cloudflare/workers-types

## Success Criteria
- [ ] POST /event validates required fields (recipe, action)
- [ ] POST /event returns 400 for invalid JSON
- [ ] POST /event returns 400 for missing required fields
- [ ] All responses include CORS headers
- [ ] OPTIONS requests handled for CORS preflight
- [ ] wrangler.toml includes Analytics Engine binding
- [ ] All tests pass

## Open Questions
None - requirements are clear from issue and design doc.
