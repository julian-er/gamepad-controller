## Summary

<!-- What does this PR change, and why? -->

## Target branch

- [ ] This PR targets the branch specified in `CONTRIBUTING.md`.

## Type of change

- [ ] feat
- [ ] fix
- [ ] docs
- [ ] chore
- [ ] refactor
- [ ] test
- [ ] perf
- [ ] ci
- [ ] build

## Related issue

<!-- Link an issue, or write "None". -->

## Checklist

- [ ] Library checks pass (`pnpm run lint`, `format:check`, `typecheck`, `test:coverage`,
      `build`, `pnpm pack --dry-run`)
- [ ] Website checks pass (if `website/` or docs were touched):
      `pnpm --filter gamepad-ui-engine-website run typecheck / test / build`
- [ ] `docs/CHANGELOG.md` updated for user-facing changes
- [ ] Docs updated and API claims verified against `src/index.ts` / `docs/API.md`
- [ ] Browser verification recorded per `website/VERIFICATION.md` (for UI interaction changes)
- [ ] PR title is a Conventional Commit (`type(scope): summary`)
