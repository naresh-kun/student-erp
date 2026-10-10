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
- `DATABASE_URL`: `postgres://erp_app:<password>@postgres:5432/<dbname>` (Runtime application connection string; restricted role without DDL or audit table mutation privileges).
- `MIGRATOR_DATABASE_URL`: `postgres://erp_migrator:<password>@postgres:5432/<dbname>` (Explicit migration role connection string; used solely during pre-deployment migration step).
- `DB_ROLE`: Set to `migrator` during schema migration jobs (`python manage.py migrate`); unset or `app` for runtime application workers.
- `REDIS_URL`: `redis://redis:6379/1`
- `CORS_ALLOWED_ORIGINS`: Restricted domain origin list.

### 3.1 Dual-Role Database Deployment Architecture (PROP_001 Option B)
To ensure durable auditability, least privilege, and schema evolution integrity, database access is segregated into two identities:
1. **Migration Role (`erp_migrator`)**:
   - Schema and table owner for all Django models and sequences in the `public` schema.
   - Configured with `NOCREATEDB` in production (database creation is reserved for isolated admin/test provisioning).
   - Executes DDL, schema migrations, and PL/pgSQL triggers (`trg_audit_logs_immutable`).
   - Run as an explicit pre-deployment job: `DB_ROLE=migrator python manage.py migrate --noinput`.
   - Migration credentials are kept in a separate deployment secret (`MIGRATION_DATABASE_PASSWORD`) and never provided to application server pods.
2. **Runtime Application Role (`erp_app`)**:
   - Restricted role used by application workers (Uvicorn / Gunicorn).
   - Configured with `NOCREATEDB` and no table/schema ownership rights.
   - Granted standard CRUD and sequence privileges across ordinary ERP tables via table grants and `ALTER DEFAULT PRIVILEGES`.
   - On the audit trail (`audit_logs`), granted only `SELECT` and `INSERT`.
   - Explicitly revoked: `UPDATE`, `DELETE`, `TRUNCATE`, and `ALTER` on `audit_logs`.
   - Cannot disable triggers or alter schema objects.

3. **Future-Object Privileges**:
   - Configured via `ALTER DEFAULT PRIVILEGES FOR ROLE erp_migrator IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO erp_app;`.
   - Any newly created domain table automatically grants CRUD to `erp_app` without manual intervention.
   - Any future audit table explicitly revokes `UPDATE, DELETE, TRUNCATE` from `erp_app` in its migration.

4. **Role Provisioning & Existing Schema Migration**:
   - Provisioning existing databases or fresh volumes is performed idempotently via:
     `MIGRATION_DATABASE_PASSWORD=... RUNTIME_DATABASE_PASSWORD=... python database/provision_roles.py`
     or `database/schema/00_init_roles.sh` (mounted into Docker entrypoint).
   - All passwords must be supplied via environment variables; hardcoded credentials are strictly rejected.
   - The provisioning script automatically transfers table and sequence ownership of existing Django objects to `erp_migrator` so future migrations can alter tables.

### Critical Frontend Variables:
- `VITE_API_BASE_URL`: Base path for the backend REST API (e.g. `/api/v1`).
- `VITE_WS_BASE_URL`: Base path for WebSockets (e.g. `wss://erp.institution.edu/ws`).
- `VITE_USE_MOCK_DATA`: Set to `true` during frontend isolated prototyping (Phase 2), `false` in production.

---

## 4. Backup & Disaster Recovery Strategy

1. **Database Snapshots**: Automated daily PostgreSQL `pg_dump` compressed and archived to off-site object storage with 30-day rolling retention.
2. **Volume Persistence**: PostgreSQL data directory (`/var/lib/postgresql/data`) and media files are mounted onto persistent VPS host volumes.
3. **Restoration Protocol**: Tested dry-run restoration scripts documented under `database/README.md`.
