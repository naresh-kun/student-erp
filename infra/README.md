# Infrastructure & Container Architecture

> **Status**: Architectural Blueprint & Development Orchestration  
> **Phase**: Phase 1 (Foundation & Governance)  
> **Last Updated**: 2026-09-23

---

## 1. Network Topology & Traffic Flow

The production and staging environments follow a layered container topology managed via Docker Compose and fronted by Caddy:

```text
               Public Internet (HTTP :80 / HTTPS :443)
                                 │
                                 ▼
                     ┌───────────────────────┐
                     │   Caddy Edge Proxy    │
                     │ (Auto TLS + Routing)  │
                     └───────────┬───────────┘
                                 │
                 ┌───────────────┴───────────────┐
                 │                               │
           Static UI Route                API & WSS Routes
           (/, /assets/*)               (/api/v1/*, /ws/*)
                 ▼                               ▼
      ┌─────────────────────┐         ┌─────────────────────┐
      │ Frontend Container  │         │  Backend Container  │
      │   (React Static)    │         │  (Django + Channels)│
      └─────────────────────┘         └──────────┬──────────┘
                                                 │
                                  ┌──────────────┴──────────────┐
                                  │                             │
                                  ▼                             ▼
                       ┌────────────────────┐        ┌────────────────────┐
                       │  PostgreSQL (5432) │        │    Redis (6379)    │
                       │ (Persistent Store) │        │ (Channels & Cache) │
                       └────────────────────┘        └────────────────────┘
```

---

## 2. Directory Contents

- `docker-compose.yml`: Multi-service orchestration defining `frontend`, `backend`, `postgres`, `redis`, and `caddy`.
- `caddy/Caddyfile`: Reverse proxy routing configuration with automated HTTPS certificate provisioning.

---

## 3. Environment Segregation

- **Phase 1 & 2 (Development)**: Frontend operates independently using Vite hot-reloading against synthetic datasets in `mock-data/`.
- **Future Integration Phases**: Containers are brought up using `docker compose up -d` to establish integrated end-to-end communication between the React bundle, Django API, PostgreSQL, and Redis.
