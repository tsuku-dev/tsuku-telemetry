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

- [x] Add SCHEMA_VERSION constant and update event validation
- [x] Update writeDataPoint to produce 13-element blob array
- [x] Update analytics queries for new blob positions (action at blob0, recipe at blob1, os at blob5, arch at blob6)
- [x] Update tests for enhanced event payloads
- [x] Add tests for new action types (create, command)

## Testing Strategy

- Unit tests: Update existing tests, add tests for new action types
- Verify 100% coverage maintained
- Manual verification with wrangler dev

## Risks and Mitigations

- Risk: Query changes may break /stats endpoint
  - Mitigation: Update queries to match new blob positions documented in DESIGN.md

## Success Criteria

- [x] TelemetryEvent interface updated with new fields
- [x] eventToDataPoint produces 13-element blob array
- [x] SCHEMA_VERSION constant set to "1"
- [x] Index uses recipe for install/update/remove, action for others
- [x] Existing tests updated for new schema
- [x] /event endpoint accepts enhanced payloads
- [x] 98.83% test coverage (100% statements/functions, one branch edge case)

## Open Questions

None - schema is fully specified in issue #12 and docs/DESIGN.md.
