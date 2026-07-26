Optimise font loading in the root layout
Description
src/app/layout.tsx and src/app/globals.css do not use the next/font loader, so typography relies on system or externally fetched faces. This costs a layout shift on first paint and leaves font sources outside the CSP allowlist built in src/lib/securityHeaders.ts.

Requirements and context
Repository scope: Agentpay-Org/Agentpay-frontend only.
Load the display and body faces through next/font with display: swap and a self-hosted subset.
Expose the generated CSS variables to Tailwind so utility classes pick them up.
Confirm no new external origins are required by the CSP after the change.
Suggested execution
Fork the repo and create a branch
git checkout -b performance/rendering-next-font
Write code in: src/app/layout.tsx
Write comprehensive tests in: src/app/layout.test.tsx
Add documentation: docs/theming.md
Test and commit
Run npm run lint, npm test, npm run build
Cover edge cases; include test output
Example commit message
perf: load fonts through next/font

Guidelines
Minimum 95 percent test coverage for impacted modules
Clear documentation
