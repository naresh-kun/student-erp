# Deployment & Infrastructure Operations Specification

> **Status**: Authoritative Infrastructure Blueprint  
> **Implementation State**: PLANNED (Specification & Baseline Compose Definition; NO live production deployment exists in Phase 1)  
> **Phase**: Phase 1 (Foundation & Governance)  
> **Last Updated**: 2026-09-23

---

## 1. Target Infrastructure Topology

```text
                  Incoming Traffic (Ports 80 / 443)
                                 │
                                 ▼
                    ┌─────────────────────────┐
                    │    Caddy Reverse Proxy  │
                    │  (Automatic Let's Encrypt│
                    │    HTTPS Termination)   │
                    └────────────┬────────────┘
                                 │
                ┌────────────────┴────────────────┐
                │                                 │
        Static Assets & UI               API & WebSocket Requests
                ▼                                 ▼
     ┌──────────────────────┐         ┌────────────────────────┐
     │  Frontend Container  │         │   Backend Container    │
     │   (Vite Static /     │         │   (Gunicorn / Uvicorn  │
     │    Nginx / Caddy)    │         │    Django Monolith)    │
     └──────────────────────┘         └───────────┬────────────┘
                                                  │
                                   ┌──────────────┴──────────────┐
                                   │                             │
                                   ▼                             ▼
                        ┌─────────────────────┐       ┌─────────────────────┐
                        │     PostgreSQL      │       │     Redis Store     │
                        │ (Relational Data &  │       │ (Channels Layer &   │
                        │  Persistent Volume) │       │   Cache Volume)     │
                        └─────────────────────┘       └─────────────────────┘
```

---

## 2. Containerized Environments

### 2.1 Multi-Container Orchestration (`docker-compose.yml`)
The platform is orchestrated via Docker Compose:
- **`caddy`**: Reverse proxy mapping public domains to internal services, terminating TLS automatically.
- **`frontend`**: Serves the compiled production React distribution.
- **`backend`**: Runs Django with WSGI/ASGI workers (Uvicorn / Gunicorn).
- **`postgres`**: PostgreSQL 16 Alpine with encrypted credentials and persisted data volume.
- **`redis`**: Redis 7 Alpine configured with persistence (AOF/RDB) for session caching and Channels message broadcasting.

---

## 3. Configuration & Environment Variables

All configuration is supplied via environment variables adhering to Twelve-Factor App methodology.

### Critical Backend Variables:
- `DEBUG`: Must be `False` in production.
- `SECRET_KEY`: High-entropy cryptographic key.
- `ALLOWED_HOSTS`: Explicit domain whitelist (e.g. `erp.institution.edu`).
- `DATABASE_URL`: `postgres://<user>:<password>@postgres:5432/<dbname>`
- `REDIS_URL`: `redis://redis:6379/1`
- `CORS_ALLOWED_ORIGINS`: Restricted domain origin list.

### Critical Frontend Variables:
- `VITE_API_BASE_URL`: Base path for the backend REST API (e.g. `/api/v1`).
- `VITE_WS_BASE_URL`: Base path for WebSockets (e.g. `wss://erp.institution.edu/ws`).
- `VITE_USE_MOCK_DATA`: Set to `true` during frontend isolated prototyping (Phase 2), `false` in production.

---

## 4. Backup & Disaster Recovery Strategy

1. **Database Snapshots**: Automated daily PostgreSQL `pg_dump` compressed and archived to off-site object storage with 30-day rolling retention.
2. **Volume Persistence**: PostgreSQL data directory (`/var/lib/postgresql/data`) and media files are mounted onto persistent VPS host volumes.
3. **Restoration Protocol**: Tested dry-run restoration scripts documented under `database/README.md`.
