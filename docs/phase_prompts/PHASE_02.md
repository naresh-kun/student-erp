# Phase 2 Specification: Frontend Core + Role Dashboards + Mock Data Integration

> **Phase**: 2 of Multi-Phase ERP Roadmap  
> **Objective**: **FRONTEND DEMONSTRATION & ROLE DASHBOARDS**  
> **Core Principle**: *"Make the ERP look and behave like a real system from the user's point of view while the backend is still under development."*  
> **Status**: IN PROGRESS (Task 2.1: Frontend Application Foundation)  
> **Last Updated**: 2026-09-23

---

## 1. Phase Objective & Mission

Phase 2 builds the interactive, role-tailored presentation layer for the **Student ERP** system. Operating entirely decoupled from the backend via synthetic datasets in `mock-data/` and a strict Service Abstraction Layer, Phase 2 delivers complete, responsive, and accessible user interfaces for all five system stakeholder roles.

---

## 2. Non-Negotiable Master Technology Stack

- **Framework**: React 18+ with TypeScript
- **Bundler & Tooling**: Vite 5+
- **Routing**: React Router (v6/v7)
- **Styling**: Tailwind CSS & CSS variable design tokens
- **Component Primitives**: shadcn/ui patterns & Radix UI accessible primitives
- **Data Fetching / Server State**: TanStack Query (React Query)
- **Forms & Validation**: React Hook Form with Zod schemas
- **Data Visualization**: Recharts
- **Iconography**: Lucide React
- **Unit & Integration Testing**: Vitest & React Testing Library

### Strict Constraints & Prohibitions
- **NO Backend Dependencies**: Zero live network calls to Django, PostgreSQL, or Redis.
- **NO Alternate Frameworks**: Next.js, Remix, FastAPI, Express, Firebase, and Supabase are strictly prohibited.
- **NO Direct JSON Coupling in Components**: UI components must consume data strictly via the Service Abstraction Layer (`services/mockService.ts`).

---

## 3. Scope & Phased Implementation Tasks

Phase 2 is executed progressively through focused tasks:
- **Task 2.1 (Current)**: Frontend Application Foundation + Route Shell + Mock Auth + Phase Documentation.
- **Task 2.2**: Student Role Experience (Dashboard, Profile, Attendance, Marks, Timetable, Calendar).
- **Task 2.3**: Parent Role Experience (Dashboard, Children Overview, Progress Tracking).
- **Task 2.4**: Faculty Role Experience (Dashboard, Class Management, Attendance Recording, Grading).
- **Task 2.5**: Admin & Principal Role Experiences (Dashboards, Resource Allocations, Reporting, Oversight).
- **Task 2.6**: Phase 2 Hardening, Polishing, Vitest Suite & Formal Sign-Off.

---

## 4. Fixed Phase 2 Routing Contract

The following 34 application routes + catch-all 404 route constitute the immutable routing contract for Phase 2:

### 4.1 Shared / Public (1 Route)
- `/login`: Mock authentication portal with 1-click role switcher and simulated credentials.

### 4.2 Student Domain (`/student/*`) (6 Routes)
- `/student/dashboard`: Academic summary, attendance alert widgets, upcoming schedule, announcements.
- `/student/profile`: Enrolled student details, contact info, emergency contacts, parent links.
- `/student/attendance`: Monthly and subject-wise attendance logs with status indicators.
- `/student/marks`: Term marks, GPA breakdown, subject evaluations, transcript preview.
- `/student/timetable`: Weekly period schedule grid with subjects, timings, and classroom locations.
- `/student/calendar`: Institutional academic calendar with exams, holidays, and campus events.

### 4.3 Parent Domain (`/parent/*`) (6 Routes)
- `/parent/dashboard`: Overview of linked children's attendance, recent marks, and urgent notices.
- `/parent/children`: Detailed profiles and academic records for all linked children.
- `/parent/attendance`: Daily and session attendance history for linked children.
- `/parent/marks`: Examination results, term report cards, and faculty feedback.
- `/parent/timetable`: Weekly schedule and classroom locations for linked children.
- `/parent/calendar`: School events, parent-teacher conferences, and institutional holidays.

### 4.4 Faculty Domain (`/faculty/*`) (5 Routes)
- `/faculty/dashboard`: Assigned classes summary, pending attendance alerts, schedule overview.
- `/faculty/classes`: Enrolled student rosters for assigned classes and sections.
- `/faculty/attendance`: Interactive daily and session attendance recording sheet.
- `/faculty/marks`: Examination mark entry and grading submission forms.
- `/faculty/timetable`: Faculty weekly teaching timetable and room assignments.

### 4.5 Admin Domain (`/admin/*`) (11 Routes)
- `/admin/dashboard`: School-wide metrics, system health, rapid actions, operational overview.
- `/admin/students`: Student directory with search, filter, and profile inspection.
- `/admin/parents`: Parent and guardian directory with linked student mappings.
- `/admin/faculty`: Faculty staff directory with departments and specializations.
- `/admin/classes`: Class, section, and room capacity management.
- `/admin/subjects`: Course catalog, syllabus, and credit assignment management.
- `/admin/attendance`: Institutional attendance audits and manual record overrides.
- `/admin/marks`: Institution-wide examination score registers and grade audits.
- `/admin/timetable`: Master timetable editor and scheduling conflict detector.
- `/admin/calendar`: Institutional calendar event publisher and holiday scheduler.
- `/admin/allocation`: Automated section and resource allocation controls.

### 4.6 Principal Domain (`/principal/*`) (5 Routes)
- `/principal/dashboard`: High-level institutional KPI cards, departmental performance, enrollments.
- `/principal/academics`: Academic syllabus progress and departmental curriculum reviews.
- `/principal/attendance`: School-wide attendance trends, absenteeism heatmaps, anomalies.
- `/principal/faculty`: Faculty workload distribution, departmental rosters, performance.
- `/principal/reports`: Executive summary reports, exportable transcripts, accreditation data.

### 4.7 Catch-All / 404 Route
- `*`: Fallback 404 Not Found handler redirecting to the active role dashboard.

---

## 5. Mock Authentication Architecture

Phase 2 authentication is **MOCKED** and operates entirely client-side:
1. **No Production Security Claims**: The mock auth system is transparently documented as a development simulation.
2. **Role Switching**: Users can log in as any of the 5 roles using pre-configured mock stakeholder profiles from `mock-data/users.json`.
3. **Session Persistence**: Active user context is stored in `localStorage` (`student_erp_active_user`) so page reloads maintain the active role and state.
4. **Route Guarding**: `<RoleRoute allowedRoles={['Student']} />` intercepts unauthorized routes and redirects either to `/login` or to the user's appropriate role dashboard.

---

## 6. Service Abstraction Pattern

The application strictly separates presentation components from data sources:
```text
React Component / Feature View
            ↓
     TanStack Query Hook
            ↓
    MockDataService (Async)
            ↓
  mock-data/*.json (Synthetic)
```
In future phases, the `MockDataService` will be complemented by `ApiDataService` communicating with Django REST APIs without altering UI components.

---

## 7. UI Principles & Accessibility Standards

- **Dashboard First**: Clean, professional, information-dense layouts without superfluous decorations or disruptive animations.
- **Responsive Layout**: Seamless presentation on desktop (1440px+), laptop (1024px), tablet (768px), and mobile (375px+).
- **Theme Support**: Slate/Zinc neutral dark/light theme tokens with Indigo primary accents.
- **Accessibility**: WCAG AA color contrast, visible focus rings, ARIA labels on icon buttons, semantic heading hierarchy (`h1`-`h4`).

### 7.1 Demo-Ready Presentation Surface Rule
Every visible route must present an intentional, believable ERP surface populated with realistic synthetic educational data. Developer-facing scaffolding, technical placeholders, and implementation notes ("Module Scaffold Ready", "Coming in Task X") are strictly prohibited on user-facing pages. Even while backend integration remains unimplemented and authentication remains mocked, the frontend must appear and behave like a coherent, production-grade ERP system to higher-up evaluators.

---

## 8. Completion Criteria for Phase 2

1. All 34 application routes + catch-all 404 route in the routing contract exist and render without 404s or console errors.
2. All 5 role-based dashboards and domain views are implemented and populated from `mock-data/`.
3. Mock authentication allows switching between all 5 roles seamlessly.
4. TanStack Query manages data fetching with loading skeletons and empty states.
5. All responsive layouts adapt cleanly across desktop, tablet, and mobile breakpoints.
6. `npm run build` compiles with zero TypeScript errors or bundling warnings.
7. Vitest unit tests validate key components and mock services.
8. Documentation and status ledgers are fully synchronized.
