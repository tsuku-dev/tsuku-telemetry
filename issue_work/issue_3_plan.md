# Issue 3 Implementation Plan

## Summary
Implement /stats endpoint to query Analytics Engine and return aggregated statistics about telemetry events.

## Approach
Use Cloudflare Analytics Engine SQL API to query aggregated data. The API requires account ID and API token for authentication. Run multiple queries to get:
1. Total installs and top recipes
2. Breakdown by OS
3. Breakdown by architecture

### Alternatives Considered
- GraphQL API: More complex, SQL API is simpler for aggregations
- Client-side aggregation: Would require fetching all data, not scalable

## Files to Modify
- `src/index.ts` - Implement /stats endpoint with Analytics Engine queries
- `src/index.test.ts` - Add tests for stats response structure
- `wrangler.toml` - Add environment variable bindings for API credentials

## Implementation Steps
- [ ] Add CF_ACCOUNT_ID and CF_API_TOKEN bindings to wrangler.toml
- [ ] Update Env interface with new bindings
- [ ] Create queryAnalyticsEngine helper function
- [ ] Implement /stats handler with SQL queries for:
  - Total installs (count where action = 'install')
  - Top recipes by install count
  - OS breakdown
  - Architecture breakdown
- [ ] Return response matching DESIGN.md format
- [ ] Add tests for response structure
- [ ] Verify all tests pass

## Analytics Engine Data Schema
Based on writeDataPoint in index.ts:
- blob1: recipe
- blob2: version
- blob3: os
- blob4: arch
- blob5: tsuku_version
- blob6: action
- index1: recipe

## SQL Queries
```sql
-- Total installs
SELECT count() as total FROM tsuku_telemetry WHERE blob6 = 'install'

-- Top recipes
SELECT blob1 as recipe,
       sum(if(blob6 = 'install', 1, 0)) as installs,
       sum(if(blob6 = 'update', 1, 0)) as updates
FROM tsuku_telemetry
GROUP BY blob1
ORDER BY installs DESC
LIMIT 10

-- By OS
SELECT blob3 as os, count() as count
FROM tsuku_telemetry
WHERE blob6 = 'install'
GROUP BY blob3

-- By arch
SELECT blob4 as arch, count() as count
FROM tsuku_telemetry
WHERE blob6 = 'install'
GROUP BY blob4
```

## Testing Strategy
- Unit tests: Verify response structure when API returns data
- Tests will need to mock the fetch call to Analytics Engine API
- Manual verification: Test against real API after deployment

## Risks and Mitigations
- Analytics Engine API rate limits: Cloudflare handles this, queries are simple
- Empty dataset: Return zeros/empty arrays gracefully
- API errors: Return 500 with error message

## Success Criteria
- [ ] GET /stats returns JSON with all required fields
- [ ] generated_at timestamp included
- [ ] period field included
- [ ] total_installs count included
- [ ] recipes array with install/update counts
- [ ] by_os breakdown included
- [ ] by_arch breakdown included
- [ ] All tests pass

## Open Questions
None - Analytics Engine SQL API is well documented.
