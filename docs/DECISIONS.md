# Architecture Decision Records (ADRs)

> **Status**: Authoritative Architectural Decisions  
> **Phase**: Phase 1 (Foundation & Governance)  
> **Last Updated**: 2026-09-23

---

## ADR 001: React + Vite Single Page Application Instead of Next.js

- **Status**: ACCEPTED / AUTHORITATIVE
- **Context**: The Student ERP is an authenticated internal enterprise portal with complex client-side workflows (timetabling, grade sheets, interactive scheduling, dashboard widgets) where SEO and Server-Side Rendering (SSR) provide negligible benefits compared to the added architectural complexity of Node.js servers, hydration mismatches, and vendor coupling.
- **Decision**: Use React 18+ with TypeScript bundled via Vite as a pure Single-Page Application (SPA).
- **Consequences**:
  - Extremely fast local developer feedback loop with instant Hot Module Replacement (HMR).
  - Clear, unambiguous boundary between static client bundles and the Python backend.
  - Zero requirement for Node.js runtime servers in production; assets can be served directly from Caddy or Nginx with low resource overhead.

---

## ADR 002: Django & Django REST Framework (DRF) as the Primary Backend

- **Status**: ACCEPTED / AUTHORITATIVE
- **Context**: An enterprise educational ERP requires robust ORM capabilities, rock-solid transactional integrity, mature authentication/session handling, built-in migration tooling, and rich admin capabilities.
- **Decision**: Standardize on Python with Django and Django REST Framework for all core API services. Alternative frameworks (such as FastAPI, Express, or Spring Boot) are strictly rejected.
- **Consequences**:
  - Battle-tested security against SQL injection, CSRF, and clickjacking.
  - Standardized serializer validation, exception formatting, and pagination.
  - Strong ecosystem integration with Django Channels and Celery.

---

## ADR 003: PostgreSQL as the Sole Authoritative Relational Database

- **Status**: ACCEPTED / AUTHORITATIVE
- **Context**: Educational ERP data is deeply relational: students belong to classes, take multiple subjects, receive marks categorized by exam types, and log daily attendance against scheduled timetable periods. Document stores (such as MongoDB) lack foreign key referential integrity and transactional multi-table consistency, risking data anomalies.
- **Decision**: Use PostgreSQL 16+ exclusively as the persistent database engine. MongoDB, Firebase, and Supabase are strictly prohibited.
- **Consequences**:
  - Full ACID compliance across multi-table academic workflows.
  - Native JSONB support provides document flexibility where needed (e.g. audit logs, report filters) without sacrificing relational guarantees.
  - Rock-solid foreign key constraints enforce cascading deletions and protect orphan rows.

---

## ADR 004: Redis & Django Channels for Realtime Event Broadcasting

- **Status**: ACCEPTED / AUTHORITATIVE
- **Context**: Real-time communication (e.g. instantaneous attendance notifications to parents, campus emergency alerts, live timetable room swaps) requires a persistent full-duplex socket architecture without polling overhead.
- **Decision**: Adopt Django Channels with ASGI backing, using Redis as the in-memory Channel Layer broker and cache store.
- **Consequences**:
  - Seamless coexistence of standard synchronous HTTP views and asynchronous WebSocket consumers in the same application codebase.
  - Redis provides sub-millisecond pub/sub message fanout across multiple worker processes.
  - Redis doubles as an API rate limiter and short-term cache.

---

## ADR 005: Mock Service Abstraction During Frontend Development

- **Status**: ACCEPTED / AUTHORITATIVE
- **Context**: To allow rapid frontend development in Phase 2 without waiting for complete backend database schema implementation and API deployments, the frontend requires realistic datasets.
- **Decision**: Implement a clean Service Abstraction Layer between React components/hooks and data sources (`VITE_USE_MOCK_DATA=true`). Components consume service interfaces (e.g. `StudentService`, `AttendanceService`) that load from `mock-data/*.json`. When backend APIs are deployed, swapping the service adapter to `/api/v1/` REST endpoints requires zero UI component rewrites.
- **Consequences**:
  - Frontend engineering proceeds at maximum velocity with rich, deterministic data.
  - Components are completely decoupled from backend network details.
  - Zero technical debt during the transition to live APIs.

---

## ADR 006: Modular Monolith Over Distributed Microservices

- **Status**: ACCEPTED / AUTHORITATIVE
- **Context**: For educational institutions, microservice architectures introduce severe operational complexity: distributed transactions (two-phase commits), network latency, service discovery overhead, and Kubernetes deployment costs.
- **Decision**: Adopt a Modular Monolith architecture within Django. Domain logic is compartmentalized into discrete Django apps under `backend/apps/`, sharing a common relational database while maintaining clean domain boundaries.
- **Consequences**:
  - Single deployment artifact drastically reduces operational overhead.
  - Relational joins and ACID transactions remain native and performant.
  - Future extraction of a specific domain into an independent microservice remains feasible if extreme scale requires it.

---

## ADR 007: Master Plan Amendment 2 — Attendance Four-Status Model (PRESENT, ABSENT, ON_DUTY, LEAVE)

- **Status**: ACCEPTED / AUTHORITATIVE (Approved Master Plan Amendment 2)
- **Context**: 
  - Educational institutions require distinguishing unexcused absences from sanctioned, faculty-approved leaves.
  - Prior specifications only supported `PRESENT`, `ABSENT`, and `ON_DUTY`. Legacy statuses (`LATE`, `EXCUSED`) were previously deprecated due to subjective scoring ambiguities.
- **Decision**:
  - Adopt a canonical 4-status model across all layers: `PRESENT`, `ABSENT`, `ON_DUTY`, `LEAVE`.
  - `LATE` and `EXCUSED` remain strictly deprecated and forbidden from reintroduction.
  - **Business Rules**:
    1. `LEAVE` represents a student absence sanctioned with faculty/school permission. Faculty are responsible for approving and marking `LEAVE`.
    2. `LEAVE` counts as an absence in attendance percentage calculations (it is included in the denominator only).
    3. `ON_DUTY` continues to count as present (included in both numerator and denominator).
    4. `LEAVE` must remain visually and semantically distinct from ordinary `ABSENT` across all UI dashboards (using Violet/Purple tokens).
    5. Mathematical calculation rule:
       $$\text{Attendance \%} = \frac{\text{PRESENT} + \text{ON\_DUTY}}{\text{PRESENT} + \text{ABSENT} + \text{ON\_DUTY} + \text{LEAVE}} \times 100$$
- **Consequences**:
  - Faculty portal includes a dedicated `LEAVE` toggle action with `approved_by_faculty_id` auditing.
  - Student and Parent portals display approved leave breakdowns without distorting the canonical absence calculation.
  - Admin and Principal oversight metrics aggregate 4 statuses with complete mathematical consistency.

