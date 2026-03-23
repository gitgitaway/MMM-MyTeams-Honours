# Security Policy

## Supported Versions

The following versions of MMM-MyTeams-Honours are covered by security updates:

| Version | Supported | Status                                                    |
| ------- | --------- | --------------------------------------------------------- |
| 1.4.0   | ✅        | Active development (latest release and audit cycle)       |
| 1.3.0   | ✅        | Maintenance branch                                        |
| < 1.2   | ❌        | No longer supported — upgrade to 1.4.0 for current fixes  |

## Reporting a Vulnerability

**IMPORTANT**: **DO NOT** open a public GitHub issue for security vulnerabilities.

Security vulnerabilities should be reported privately to maintain responsible disclosure and protect users.

### How to Report

Please report security vulnerabilities by:

1. **Opening a private security advisory** on GitHub (preferred)
   - Go to the Security tab → Advisories → New draft security advisory
   - Provide detailed information about the vulnerability and how to reproduce it

2. **Emailing** the maintainers directly (if GitHub advisory is not available)
   - **Contact**: [gitgitaway](https://github.com/gitgitaway)
   - **Subject line**: "[SECURITY] MMM-MyTeams-HonoursVulnerability Report"

### What to Include

When reporting a vulnerability, please include:

- **Description**: Clear explanation of the vulnerability
- **Impact**: What an attacker could accomplish
- **Steps to Reproduce**: Detailed, repeatable steps
- **Affected Versions**: Which versions are impacted
- **Suggested Fix**: Optional recommendations or mitigation ideas
- **Proof of Concept**: Code, screenshots, or logs demonstrating the issue

### Response Timeline

- **Initial Response**: Within 48 hours of report
- **Status Update**: Within 7 days with assessment and mitigation plan
- **Critical Vulnerabilities**: Patched within 7 days when possible
- **Medium/Low Vulnerabilities**: Patched in the next scheduled release

## Security Update Process

When a security vulnerability is confirmed:

1. **Assessment**: Validate the report and quantify the impact
2. **Development**: Build and test the patch in a private branch
3. **Coordination**: Notify downstream modules (MMM-MyTeams suite) if affected
4. **Release**: Publish a GitHub Security Advisory and release notes
5. **Notification**: Alert users via:
   - GitHub Security Advisory
   - GitHub Release Notes
   - README/SECURITY.md banner for critical issues

## Security Best Practices for Users

### Installation Security

```bash
# Always verify package integrity
npm audit

# Fix known vulnerabilities
npm audit fix

# Keep this module up to date
npm update
```

### Configuration Security

- **Disable debug mode in production** by setting `debug: false` in `config.js`
- **Hostname Allowlist** (SEC-003): The module now restricts scraping to a trusted set of hostnames (e.g., `en.wikipedia.org`, `www.wikipedia.org`, `query.wikidata.org`). This prevents the module from being used for SSRF (Server-Side Request Forgery) attacks on internal network endpoints.
- **CSS Injection Protection** (SEC-002): Any runtime color overrides (e.g., `fontColorOverride`) are validated against a strict regex before being applied. This prevents arbitrary CSS injection into the MagicMirror interface.
- **XSS Protection** (SEC-001): The module uses `textContent` instead of `innerHTML` for all dynamic data, eliminating the risk of cross-site scripting (XSS) from malicious scraping targets.

### Data Privacy

This module:

- ✅ **Does NOT** set cookies, trackers, or analytics hooks
- ✅ **Does NOT** require authentication or personal API keys
- ✅ **Caches Data Locally**: Honours data is cached in `.honours-cache.json` in the module directory to reduce network load.

## Known Security Measures

The module enforces the following protections:

- **Shared Request Manager** (`shared-request-manager.js`)
  - Coordinated queue with per-domain/backoff rate limiting to prevent DoS (Denial of Service) on data providers.
- **Request Sanitization**: All URLs and configuration values are validated before use.


## Security Audit Schedule

- **Automated audits**: Run `npm audit` each time dependencies are updated
- **Manual reviews**: Code reviews preceding every major release (e.g., 1.3.0 overhaul)
- **Dependency checks**: Quarterly review of `cheerio`, `node-fetch`, and transitive packages
- **Community testing**: Responsible disclosure encouraged; dual maintenance across the MyTeams modules keeps regressions visible

## Vulnerability Disclosure Policy

We follow **Coordinated Vulnerability Disclosure (CVD)**:

1. **Private disclosure** to maintainers first
2. **Patch development** in coordination with the reporter
3. **Public disclosure** only after the fix is available
4. **Credit** is given to the reporter in release notes unless anonymity is requested

## Security Hall of Fame

Security researchers who responsibly disclose vulnerabilities will be credited here:

*No vulnerabilities reported yet. Help us maintain security!*

## Scope

### In Scope

Security vulnerabilities in:

- Module code (`MMM-MyTeams-Honours.js`, `node_helper.js`)
- Shared HTTP queue (`shared-request-manager.js`)
- Configuration parsing, caching logic, and localisation files used to render the UI

### Out of Scope

- MagicMirror² core vulnerabilities (report to the MagicMirror project)
- Third-party website vulnerabilities (report to the originating site)
- Third-party module interactions beyond the MMM-MyTeams suite
- Physical access attacks (kiosk security is the user's responsibility)
- Social engineering attacks targeting module maintainers or users

## Contact

For security-related questions or concerns:

- **Security Issues**: Use GitHub Security Advisories (preferred)
- **General Security Questions**: Open a public GitHub Discussion
- **Security Documentation**: Refer to README.md and this SECURITY.md

## Version History

-
---

**Last Updated**: 2026-03-22  
**Policy Version**: 1.1
