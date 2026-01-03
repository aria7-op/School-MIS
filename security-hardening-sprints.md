# Security Hardening Sprint Roadmap

## Sprint 1 – Critical Authentication & Secrets (Week 1)
- Enforce required env vars for auth/database/encryption keys (backend + scripts) ✅
- Remove hardcoded JWT/login fallbacks; migrate login/session to HttpOnly cookies
- Tighten CORS to explicit allow-lists; remove wildcard headers
- Remove legacy unauthenticated routes; route through middleware
- Validate env deployment secrets rotation plan
- Tests: login regression, auth API, CORS preflight, automated secret scan

## Sprint 2 – Application & Data Guardrails (Week 2)
- Implement CSRF protection (SameSite + tokens) where cookies in use
- Enforce input validation (zod/Joi) across controllers; sanitize responses
- Harden file uploads (type validation, AV scanning, signed URLs)
- Add least-privilege DB role, restrict network access, enable TLS to DB
- Introduce security headers via helmet (HSTS, CSP frame-ancestors)
- Tests: file upload abuse cases, SQL injection probes, helmet header checks

## Sprint 3 – Frontend & Transport Hardening (Week 3)
- Replace token localStorage usage with cookie/session abstraction
- Implement CSP + SRI on frontend bundles; sanitize dynamic HTML
- Remove debug logs in production builds; standardize error pages
- Formalize HTTPS enforcement, TLS config, HSTS preload readiness
- Tests: XSS unit tests, CSP violation monitoring, TLS Qualys scan

## Sprint 4 – Infrastructure & CI/CD (Week 4)
- Centralize secrets (Vault/AWS Secrets Manager); rotate keys
- Harden OS/containers (patch pipeline, image scanning, seccomp/AppArmor)
- Configure WAF/DDoS protection; private subnets for DB/internal services
- Integrate SCA + SAST + DAST in CI (Dependabot/Snyk, OWASP ZAP)
- Tests: container scan gate, DAST pipeline run, WAF rule simulation

## Sprint 5 – Monitoring & Process (Week 5)
- Centralize logs & metrics (ELK/SIEM); configure auth anomaly alerts
- Establish incident response playbooks + tabletop exercise
- Conduct access review & enforce MFA for admin/dev accounts
- Schedule penetration test and threat modeling workshop
- Launch security training refresh + optional bug bounty policy

## Continuous
- Weekly backlog grooming; track residual risks
- Monthly secret rotation + access review cadence
- Quarterly security retro with metrics (MTTD/MTTR, vulnerabilities closed)

