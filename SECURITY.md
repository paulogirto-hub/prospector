# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 2.x     | ✅ Active support  |
| 1.x     | ❌ End of life     |

## Reporting a Vulnerability

**Please do NOT report security vulnerabilities through public GitHub issues.**

Instead, please report them via:

1. **Email**: Send details to [haasdev33@gmail.com](mailto:haasdev33@gmail.com) with the subject `Security: Prospector`
2. **GitHub**: Use the [Security Advisories](https://github.com/paulogirto-hub/prospector/security/advisories) feature

### What to Include

- **Description** of the vulnerability
- **Steps to reproduce** or proof of concept
- **Impact** — what could an attacker do?
- **Suggested fix** (if you have one)

### Response Timeline

- **Acknowledgment**: Within 48 hours
- **Initial assessment**: Within 5 business days
- **Fix**: Depends on severity — critical fixes prioritized

## Security Features

Prospector implements the following security measures:

| Feature | Status |
|---------|--------|
| Rate limiting (sliding window) | ✅ Implemented |
| XSS protection (tagged templates) | ✅ Implemented |
| CORS configuration | ✅ Implemented |
| Circuit breaker (AI providers) | ✅ Implemented |
| Input validation (Pydantic) | ✅ Implemented |
| Authentication | ❌ Planned |
| HTTPS enforcement | ✅ Via Traefik |
| Secret management | ⚠️ Environment variables |

## Known Limitations

- **No authentication**: API is currently open — do not expose directly to the internet without a reverse proxy
- **File-based storage**: Data stored as JSON files — not suitable for multi-tenant production without persistence layer
- **No rate limiting per user**: Current rate limiting is per IP only

## Responsible Disclosure

We appreciate responsible disclosure and will credit security researchers who report vulnerabilities (unless they prefer to remain anonymous).