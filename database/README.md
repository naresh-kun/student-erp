# Database Persistency & PostgreSQL Governance

> **Engine**: PostgreSQL 16+  
> **Status**: Architectural Specification & Schema Definition  
> **Phase**: Phase 1 (Foundation & Governance)  
> **Last Updated**: 2026-09-23

---

## 1. Governance Principles

1. **Sole Persistent Database**: PostgreSQL is the exclusive relational database for the Student ERP. Non-relational databases (MongoDB), BaaS (Firebase, Supabase), and SQLite in production are strictly forbidden.
2. **Migrations as Source of Truth**: When backend models are developed in future phases, Django's native migration system (`python manage.py makemigrations`) will govern all schema evolutions. No manual DDL executions directly in production.
3. **Third Normal Form (3NF)**: All transactional entities (users, students, faculty, classes, subjects, enrollments, attendance, marks) must be strictly normalized to prevent write anomalies.

---

## 2. Directory Contents

- `schema/`: Contains conceptual reference DDL (`init.sql`) illustrating the normalized PostgreSQL table structures, constraints, and composite indexes specified in `docs/DATABASE_SCHEMA.md`.

---

## 3. Connection & Pooling Policies

- **Production Pooling**: PgBouncer or Django's persistent connection pooling (`CONN_MAX_AGE = 600`) will be utilized in production to manage high-throughput concurrent requests without exhausting PostgreSQL connection limits.
- **Backups**: Daily compressed `pg_dump` backups with cryptographic checksums and automated retention rotation to secure offsite storage.
