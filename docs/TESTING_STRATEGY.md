# Testing Strategy & Quality Assurance Framework

> **Status**: Authoritative Testing Governance  
> **Phase**: Phase 1 (Foundation & Governance)  
> **Last Updated**: 2026-09-23

---

## 1. Multi-Tier Testing Pyramid

The Student ERP system enforces a progressive, multi-tier testing strategy ensuring data consistency, UI accessibility, and API security.

```text
               ▲
              / \
             /   \
            / E2E \         Playwright
           /───────\        (Cross-browser, Critical User Journeys)
          / Integr- \       Pytest-Django / Vitest + RTL
         /   ation   \      (API views, Database queries, Component trees)
        /─────────────\
       /   Unit Tests  \    Pytest / Vitest
      /─────────────────\   (Pure functions, Zod schemas, Services, Utilities)
```

---

## 2. Tier Specifications

### 2.1 Backend Testing (Pytest)
- **Framework**: `pytest`, `pytest-django`, `pytest-mock`, `faker`.
- **Target Coverage**:
  - Model validation and database constraints (foreign keys, unique constraints).
  - DRF API endpoint response contracts, pagination, and status codes.
  - Granular RBAC permission enforcement:
    - Verifying Students receive `403 Forbidden` on Admin endpoints.
    - Verifying Faculty cannot modify marks for students outside their assigned courses.
    - Verifying Parents cannot read data for non-linked student IDs.
  - Service layer logic (allocation algorithms, grade card calculations).

### 2.2 Frontend Testing (Vitest + React Testing Library)
- **Framework**: `vitest`, `@testing-library/react`, `@testing-library/user-event`, `msw` (Mock Service Worker).
- **Target Coverage**:
  - Reusable component primitives (Button, Card, Modal, Input).
  - Form validations via Zod schemas and user input error feedback.
  - Role-based routing gatekeeper components (`<RoleRoute />`).
  - Mock service data loaders and state management hooks.

### 2.3 End-to-End Testing (Playwright)
- **Framework**: `@playwright/test`.
- **Target Coverage**:
  - Full user authentication lifecycle across all 5 roles.
  - Faculty daily attendance logging workflow.
  - Student and Parent grade report and timetable viewing flows.
  - Admin timetable scheduling and conflict detection.

---

## 3. Phase 1 Testing & Structural Validation

In **Phase 1**, full functional test suites and E2E browsers are not yet active because no business logic or full UI exists. Phase 1 validation focuses strictly on:
1. **JSON Dataset Integrity**: Syntactic validation of all 10 mock datasets in `mock-data/`.
2. **Directory & File Layout**: Automated verification that all required directories, skeletons, and markdown files exist without competing paths.
3. **Frontend Tooling Validation**: Verification that `package.json`, `tsconfig.json`, and `vite.config.ts` are syntactically sound and typecheck-ready.
4. **Backend Python Validation**: Verification that Django configuration files and app markers compile cleanly under Python syntax validation.
