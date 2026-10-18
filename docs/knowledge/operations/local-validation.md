# Local validation and required CI

The local commands and runtime matrix remain in [CONTRIBUTING](../../../CONTRIBUTING.md#checks-before-opening-a-pr).
Use pnpm 12.4.2 and locked dependencies. Validate the library on both Node 20 and
24, and the website on Node 24, sequentially to avoid overloading the machine.

Run from a clean committed checkout after installing locked dependencies. The runner
stops on the first failure and prints the exact commit SHA, runtime, date and result.
Save the command output with the PR. Record failures and skipped checks explicitly.
If a merge or squash changes the SHA, validate the resulting clean commit again before
release. Local evidence is a maintainer convention; it does not enforce branch protection
or replace required GitHub checks. A checked PR box alone is not evidence.
Do not copy production credentials or real data into a validation checkout.

The migration to delivery-only Actions is blocked by the `protect-main` ruleset,
which requires `library (20.x)`, `library (24.x)` and `website`. CI remains intact.
Do not remove these jobs, substitute success-only jobs, change protections, or
merge without their actual successful results. Local output cannot satisfy them.

Pages build, design/source guards and artifact delivery remain unchanged. Tag-driven
npm/GitHub releases retain their version/main checks, OIDC, provenance and release
controls. `prepublishOnly` intentionally remains unchanged: it validates and builds
the publishable package. Splitting that lifecycle safely belongs to a later change
after the required-check constraint is resolved; no ad hoc release should test it.
