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

- [ ] Create validateEvent() function with validation logic per action type
- [ ] Update /event handler to use validateEvent() and return error message
- [ ] Add tests for invalid field combinations (must-be-empty violations)
- [ ] Add tests for missing required fields
- [ ] Verify 100% coverage maintained

## Testing Strategy

- Unit tests for validateEvent() via /event endpoint
- Test each action type with valid payload
- Test each action type with invalid combinations
- Verify error messages are descriptive

## Risks and Mitigations

- Risk: Breaking existing valid events
  - Mitigation: Ensure all existing tests still pass

## Success Criteria

- [ ] validateEvent() function implemented
- [ ] Returns descriptive error message for invalid events
- [ ] /event returns 400 for invalid combinations
- [ ] Unit tests for each action type's validation
- [ ] Valid events still return 200
- [ ] 100% test coverage maintained

## Open Questions

None - validation rules are fully specified in issue #14 and docs/DESIGN.md.
