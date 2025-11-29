# Issue 14 Implementation Plan

## Summary

Add a `validateEvent()` function that validates events based on action type, rejecting invalid field combinations with descriptive error messages.

## Approach

Create a dedicated `validateEvent()` function that:
1. Validates required fields per action type
2. Validates that fields that "must be empty" are indeed empty
3. Returns a descriptive error message or null if valid

Replace inline validation in the /event handler with the new function.

### Alternatives Considered

- Keep validation inline: Not chosen as it's harder to test and maintain
- Return boolean instead of error message: Not chosen as descriptive errors help debugging

## Files to Modify

- `src/index.ts` - Add validateEvent() function and update /event handler
- `src/index.test.ts` - Add tests for validation rules

## Files to Create

None

## Implementation Steps

- [x] Create validateEvent() function with validation logic per action type
- [x] Update /event handler to use validateEvent() and return error message
- [x] Add tests for invalid field combinations (must-be-empty violations)
- [x] Add tests for missing required fields
- [x] 100% line coverage maintained (85% branch coverage due to defensive ternaries)

## Testing Strategy

- Unit tests for validateEvent() via /event endpoint
- Test each action type with valid payload
- Test each action type with invalid combinations
- Verify error messages are descriptive

## Risks and Mitigations

- Risk: Breaking existing valid events
  - Mitigation: Ensure all existing tests still pass

## Success Criteria

- [x] validateEvent() function implemented
- [x] Returns descriptive error message for invalid events
- [x] /event returns 400 for invalid combinations
- [x] Unit tests for each action type's validation
- [x] Valid events still return 200
- [x] 100% line coverage (branch coverage gap is defensive code)

## Open Questions

None - validation rules are fully specified in issue #14 and docs/DESIGN.md.
