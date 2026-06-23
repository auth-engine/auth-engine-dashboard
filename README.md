# auth-engine-dashboard

Production-ready admin dashboard for **AuthEngine** — platform operations, tenant management, user self-service, MFA, and passkeys.

Built with Next.js. Talks to the API via `NEXT_PUBLIC_API_URL`.

## Development

### 1. Local

Requires Node **20+** and a running API.

```bash
cd auth-engine-dashboard
cp .env.example .env.local
npm ci
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Default API: `http://localhost:8000/api/v1`.

### 2. Compose

Runs automatically with the full stack — no separate dashboard setup:

```bash
cd auth-engine-infra/compose
cp env.local.example .env
docker compose up -d
```

Open [http://localhost:3000](http://localhost:3000). Migrate and seed per [Quick Start](https://docs.authengine.org/quick-start/).

## Production

| Path | Guide |
|------|-------|
| Local VM + Cloudflare Tunnel | [deploy-local-vm.sh](https://github.com/auth-engine/auth-engine-infra/blob/main/scripts/deploy-local-vm.sh) |
| AWS EC2 or any cloud VM | [deploy-aws.sh](https://github.com/auth-engine/auth-engine-infra/blob/main/scripts/deploy-aws.sh) |

Docker image: `qniranjan01/authengine-dashboard:latest`

## Documentation

| Guide | Link |
|-------|------|
| Quick Start | [docs.authengine.org/quick-start](https://docs.authengine.org/quick-start/) |
| Deployment | [docs.authengine.org/deployment](https://docs.authengine.org/deployment/) |
| API Reference | [docs.authengine.org/api-reference](https://docs.authengine.org/api-reference/) |
| OAuth2 / OIDC | [docs.authengine.org/oauth2-oidc-guides](https://docs.authengine.org/oauth2-oidc-guides/) |
| Architecture | [docs.authengine.org/architecture](https://docs.authengine.org/architecture/) |

## Related repositories

[auth-engine](https://github.com/auth-engine/auth-engine) · [auth-engine-data](https://github.com/auth-engine/auth-engine-data) · [auth-engine-infra](https://github.com/auth-engine/auth-engine-infra) · [auth-engine-docs](https://github.com/auth-engine/auth-engine-docs)
