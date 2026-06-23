# auth-engine-dashboard

Next.js dashboard for **AuthEngine** — platform and tenant administration, user self-service, MFA and passkeys.

**Documentation:** [auth-engine-docs](https://github.com/auth-engine/auth-engine-docs) · published at [docs.authengine.org](https://docs.authengine.org)

| Guide | Link |
|-------|------|
| Quick Start | [quick-start.md](https://docs.authengine.org/quick-start/) |
| OAuth2 / OIDC | [oauth2-oidc-guides.md](https://docs.authengine.org/oauth2-oidc-guides/) |
| API Reference | [api-reference.md](https://docs.authengine.org/api-reference/) |
| Architecture | [architecture.md](https://docs.authengine.org/architecture/) |
| Deployment | [deployment.md](https://docs.authengine.org/deployment/) |
| Security | [security-overview.md](https://docs.authengine.org/security-overview/) |

## What this repository is

Next.js 16 admin UI for platform administration (`/platform/*`), tenant administration (`/tenant/*`), and user self-service (`/me/*`). It talks to the API via `NEXT_PUBLIC_API_URL`. Docker Compose manifests live in **[auth-engine-infra](https://github.com/auth-engine/auth-engine-infra)**.

## Local development

```bash
cd auth-engine-dashboard
cp .env.example .env.local
npm ci && npm run dev
```

Minimum `.env.local` values:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Point `NEXT_PUBLIC_API_URL` at a running API (local or remote). For the full stack, use Compose from `auth-engine-infra`.

## Production

| Host | Role |
|------|------|
| [api.authengine.org](https://api.authengine.org) | API + Swagger |
| [auth.authengine.org](https://auth.authengine.org) | OIDC / login UI |
| [app.authengine.org](https://app.authengine.org) | Admin dashboard |
| [docs.authengine.org](https://docs.authengine.org) | Documentation |

## Docker

Dockerfile only — compose files live in **[auth-engine-infra/compose](https://github.com/auth-engine/auth-engine-infra/tree/main/compose)**.

```bash
cd auth-engine-infra/compose
docker compose up -d --build
```

Pre-built production images: [Deployment guide](https://docs.authengine.org/deployment/).

**CI/CD:** merge to `main` runs lint/build and pushes `DOCKERHUB_USERNAME/authengine-dashboard:latest`. Redeploy the `dashboard` workload in Rancher after a new image is available.

## Contributing

See [Contributing](https://docs.authengine.org/contributing/) or [CONTRIBUTING.md](CONTRIBUTING.md). Report security issues per [Security Policy](https://docs.authengine.org/security-policy/) — not via public issues.

## Related repositories

| Repository | Role |
|------------|------|
| [auth-engine](https://github.com/auth-engine/auth-engine) | FastAPI backend — IAM, OIDC, introspection |
| [auth-engine-data](https://github.com/auth-engine/auth-engine-data) | Roles, permissions & super-admin seeding |
| [auth-engine-docs](https://github.com/auth-engine/auth-engine-docs) | Platform documentation |
| [auth-engine-infra](https://github.com/auth-engine/auth-engine-infra) | Terraform & Docker Compose |
| [.github](https://github.com/auth-engine/.github) | Org profile, contributing & security policy |
