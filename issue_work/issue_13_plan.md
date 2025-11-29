# Issue 13 Implementation Plan

## Summary

Update the Worker to use the enhanced telemetry event schema with 13 blob fields and schema versioning, including updated event validation, data point writing, and analytics queries.

## Approach

Modify `src/index.ts` to:
1. Add SCHEMA_VERSION constant and TelemetryEvent interface
2. Update event validation to accept new fields and action types
3. Update writeDataPoint to use 13-element blob array with schema version
4. Update analytics queries to use new blob positions

### Alternatives Considered

- Create separate eventToDataPoint function: Not chosen as simpler to inline the blob array construction
- Keep backward compatibility with old schema: Not chosen as no production data exists yet

## Files to Modify

- `src/index.ts` - Update event handling and analytics queries
- `src/index.test.ts` - Update tests for new schema

## Files to Create

None

## Implementation Steps

- [ ] Add SCHEMA_VERSION constant and update event validation
- [ ] Update writeDataPoint to produce 13-element blob array
- [ ] Update analytics queries for new blob positions (action at blob0, recipe at blob1, os at blob5, arch at blob6)
- [ ] Update tests for enhanced event payloads
- [ ] Add tests for new action types (create, command)

## Testing Strategy

- Unit tests: Update existing tests, add tests for new action types
- Verify 100% coverage maintained
- Manual verification with wrangler dev

## Risks and Mitigations

- Risk: Query changes may break /stats endpoint
  - Mitigation: Update queries to match new blob positions documented in DESIGN.md

## Success Criteria

- [ ] TelemetryEvent interface updated with new fields
- [ ] eventToDataPoint produces 13-element blob array
- [ ] SCHEMA_VERSION constant set to "1"
- [ ] Index uses recipe for install/update/remove, action for others
- [ ] Existing tests updated for new schema
- [ ] /event endpoint accepts enhanced payloads
- [ ] 100% test coverage maintained

## Open Questions

None - schema is fully specified in issue #12 and docs/DESIGN.md.
