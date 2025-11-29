# Issue 4 Implementation Plan

## Summary

Create a GitHub Actions workflow to auto-deploy the Cloudflare Worker on push to main using the official wrangler-action.

## Approach

Follow the deploy workflow template in docs/DESIGN.md exactly. The workflow uses `cloudflare/wrangler-action@v3` which handles Wrangler installation and deployment automatically.

### Alternatives Considered
- Manual wrangler deploy in CI: Requires more setup (Node.js, npm install wrangler, configure auth). The official action handles this automatically.
- Deploy on tags only: Adds friction to releases. Push-to-main is simpler for this project.

## Files to Create
- `.github/workflows/deploy.yml` - Deploy workflow triggered on push to main

## Files to Modify
None

## Implementation Steps
- [x] Create `.github/workflows/deploy.yml` with wrangler-action

## Testing Strategy
- Manual verification: Merge to main should trigger deployment
- The workflow will fail until `CLOUDFLARE_API_TOKEN` secret is configured (expected)

## Risks and Mitigations
- Missing secret: Workflow will fail gracefully with clear error message until secret is added
- Accidental deploy of broken code: CI workflow runs first on push to main; deploy workflow runs in parallel but broken code would be caught by tests

## Success Criteria
- [ ] `.github/workflows/deploy.yml` exists and is valid YAML
- [ ] Workflow triggers only on push to main
- [ ] Uses `CLOUDFLARE_API_TOKEN` secret

## Open Questions
None - the design document specifies the exact workflow configuration.
