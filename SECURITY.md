# Security Policy

AgentPay is a Stellar payment frontend, so please report suspected vulnerabilities privately and responsibly.

## Supported versions

| Version | Supported | Notes |
| --- | --- | --- |
| `main` | Yes | Active development branch and source for the next deployment. |
| Latest production deployment | Yes | Security fixes are prepared from `main` and released as soon as practical. |
| Older commits, forks, or local modifications | No | Please reproduce against `main` or the latest production deployment before reporting. |

## Reporting a vulnerability

Please do not open public GitHub issues for exploitable security findings. Use GitHub's private vulnerability reporting flow for this repository, or contact a maintainer privately and ask for a private advisory thread if the GitHub report button is unavailable.

Include as much of the following as you can:

- Affected route, component, API call, wallet flow, or security header.
- Reproduction steps and browser/runtime details.
- Expected impact, including whether payments, wallet permissions, API keys, or personal data are involved.
- Screenshots, logs, or a minimal proof of concept that avoids exposing secrets or third-party data.

## Response expectations

| Step | Target window |
| --- | --- |
| Initial acknowledgement | 2 business days |
| Triage decision | 5 business days |
| High or critical fix plan | 10 business days after triage |
| Coordinated disclosure | After a fix is released, unless a different timeline is agreed in the advisory |

## Scope

In scope:

- Wallet connection and payment-flow UI issues.
- Cross-site scripting, unsafe URL handling, or injection into generated commands.
- Content-Security-Policy, nonce, and browser security header regressions.
- Secrets or credentials accidentally committed to the repository.
- Dependency vulnerabilities that are reachable from production code.

Out of scope:

- Social engineering, spam, denial-of-service, or physical attacks.
- Findings that require compromised user devices, malicious browser extensions, or leaked private keys.
- Vulnerabilities only present in unsupported forks or local modifications.
- Automated scanner reports without a reproducible AgentPay-specific impact.

## Existing security architecture

The CSP and browser security header architecture is documented in [docs/security-headers.md](docs/security-headers.md) and implemented in `src/lib/securityHeaders.ts`.

When reporting or fixing header issues, keep that document and `src/lib/__tests__/securityHeaders.test.ts` aligned with source behavior.

## Safe handling

Do not include private keys, seed phrases, API keys, live credentials, `.env` files, or personal data in reports. If a proof of concept needs sample data, use synthetic accounts and clearly mark any testnet-only material.