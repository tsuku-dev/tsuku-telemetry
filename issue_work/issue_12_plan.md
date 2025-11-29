# Issue 12 Implementation Plan

## Summary

Update docs/DESIGN.md with the enhanced telemetry event schema, documenting all 13 blob positions, example events for each action type, schema versioning strategy, and updated query examples.

## Approach

Directly update the existing DESIGN.md with the enhanced schema from the approved design. This is a documentation-only change that prepares for future Worker implementation (separate issue).

### Alternatives Considered

- Create a new DESIGN-schema.md file: Not chosen because the schema is core to the design and belongs in the main document
- Implement Worker changes alongside docs: Not chosen because issue #12 is explicitly documentation-only

## Files to Modify

- `docs/DESIGN.md` - Update Event Schema section with enhanced schema, add example events, query examples, and schema versioning documentation

## Files to Create

None

## Implementation Steps

- [ ] Update Event Schema section with 13 blob positions
- [ ] Add example events for all action types (install, update, remove, create, command)
- [ ] Add Schema Versioning section
- [ ] Update Stats Response Format to reflect new capabilities
- [ ] Update Query Examples section
- [ ] Add Validation Rules section

## Testing Strategy

- Manual verification: Review docs/DESIGN.md for completeness and accuracy
- CI check: Ensure typecheck and tests still pass (docs-only change)

## Risks and Mitigations

- Risk: Schema documentation diverges from future implementation
  - Mitigation: Schema is well-defined in approved design; implementation issues will reference this doc

## Success Criteria

- [ ] All 13 blob positions documented
- [ ] Example events for each action type included
- [ ] Schema versioning strategy documented
- [ ] Query examples updated for new blob positions
- [ ] CI passes

## Open Questions

None - schema is fully specified in the approved design document.
