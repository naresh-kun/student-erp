# PHASE 3 — TASK 3.4
# Attendance & Marks Database Layer

**Project:** Student ERP — Enterprise Educational Management System
**Phase:** 3 — Backend Foundation + Database
**Task:** 3.4 — Attendance & Marks Database Layer
**Status:** COMPLETED (Attendance & Marks Database Layer Verified)
**Prerequisites:** Task 3.2 signed off + Task 3.3 completed and verified

---

## 1. TASK OBJECTIVE

Implement the concrete Django ORM/database layer for:

1. Student Attendance
2. Leave Applications
3. Examination / Mark Records

Task 3.4 establishes the persistent domain structure needed for attendance and marks while preserving the approved Student ERP business rules.

This task must build on the core entities created in Task 3.3.

The implementation must:

- create attendance persistence models;
- create leave-request persistence where required;
- create examination/assessment type persistence;
- create mark persistence;
- establish correct foreign-key relationships;
- enforce attendance status rules;
- enforce marks-out-of-100 rules;
- preserve the approved Indian-school grading model;
- keep derived calculations deterministic;
- provide a clean foundation for later REST APIs and frontend integration.

---

# 2. MANDATORY DOCUMENTATION READ

Before changing ANY code, read:

1. `docs/PROJECT_STRUCTURE.md`
2. `docs/ARCHITECTURE.md`
3. `docs/BACKEND_ARCHITECTURE.md`
4. `docs/DATABASE_SCHEMA.md`
5. `docs/API_CONTRACT.md`
6. `docs/RBAC_PERMISSIONS.md`
7. `docs/DEVELOPMENT_WORKFLOW.md`
8. `docs/TESTING_STRATEGY.md`
9. `docs/PROJECT_STATUS.md`
10. `docs/CHANGELOG.md`
11. `docs/DECISIONS.md`
12. `docs/phase_prompts/PHASE_03.md`
13. `docs/phase_prompts/Phase_3_Task_3.2.md`
14. `docs/phase_prompts/Phase_3_Task_3.3.md`
15. `docs/phases/PHASE_03_STATUS.md`
16. This file.

Then inspect the actual repository.

Do not infer schema details from memory when an authoritative project document already defines them.

---

# 3. PREREQUISITES

Task 3.4 MUST NOT begin if:

- Task 3.2 still contains premature models;
- Task 3.3 core models are missing;
- Task 3.3 has unresolved migration problems;
- current Django system checks fail;
- the actual repository differs materially from the documented architecture without an approved decision.

If a prerequisite is broken:

STOP and report it.

Do not silently repair another task's scope.

---

# 4. TASK BOUNDARY

## Task 3.4 OWNS

### Attendance

- attendance persistence;
- attendance session/date representation;
- student attendance records;
- attendance statuses;
- leave application persistence;
- leave approval state required by the domain;
- attendance calculations/utility integration required for persistence validation.

### Marks

- examination/assessment type persistence;
- student mark records;
- raw mark validation;
- percentage/grade derivation support;
- cumulative academic mark calculations where appropriate to the database/domain layer.

---

# 5. TASKS THAT REMAIN OUT OF SCOPE

Do NOT implement:

- authentication;
- login;
- JWT;
- RBAC middleware;
- full REST CRUD;
- frontend/backend integration;
- Redis;
- WebSockets;
- notifications;
- timetable;
- calendar;
- allocation engine;
- reporting UI;
- AI;
- background workers.

Authentication and RBAC belong to Phase 4.

REST API work belongs to Task 3.6.

Do not turn Task 3.4 into a complete attendance/marks application.

---

# 6. APPROVED ATTENDANCE MODEL

Attendance status is EXACTLY:

- `PRESENT`
- `ABSENT`
- `ON_DUTY`
- `LEAVE`

These are the only valid persisted attendance statuses.

The following are permanently forbidden:

- `LATE`
- `EXCUSED`

Do not reintroduce them under different spelling or aliases.

---

# 7. ATTENDANCE SEMANTICS

The approved semantics are:

### PRESENT

Student attended normally.

### ABSENT

Student was absent without the LEAVE/ON_DUTY classification.

### ON_DUTY

Student was away for an approved institutional duty.

`ON_DUTY` counts as present for attendance percentage.

### LEAVE

Student absence has faculty/school permission.

`LEAVE` remains visibly distinct from `ABSENT`.

`LEAVE` counts as absence in attendance percentage calculations.

Faculty is the authority responsible for approving/marking LEAVE.

Do not treat LEAVE as PRESENT.

---

# 8. ATTENDANCE PERCENTAGE FORMULA

The canonical formula is:

Attendance % =

(PRESENT + ON_DUTY)
/
(PRESENT + ABSENT + ON_DUTY + LEAVE)
× 100

Therefore:

- PRESENT → numerator + denominator
- ON_DUTY → numerator + denominator
- ABSENT → denominator only
- LEAVE → denominator only

The implementation must never silently exclude LEAVE from the denominator.

A zero-record denominator must be handled safely and deterministically.

Do not generate NaN, Infinity, or misleading percentages.

---

# 9. ATTENDANCE PERSISTENCE DESIGN

The concrete attendance database design MUST follow `DATABASE_SCHEMA.md`.

At the conceptual level, the system needs to distinguish:

1. an attendance occurrence/session/date context;
2. the student's attendance record for that occurrence;
3. a leave application/approval record where required.

Do not flatten unrelated concepts into a single uncontrolled table.

The exact entity names and fields must follow the authoritative schema.

---

# 10. ATTENDANCE RELATIONSHIPS

Attendance must maintain referential integrity to the core entities established in Task 3.3.

Depending on the authoritative schema, attendance records may relate to:

- Student
- academic year
- class/section
- subject
- faculty
- attendance/session context

Do not invent extra relationships merely because they may be useful later.

Any relationship not explicitly supported by the schema must be reported before implementation.

---

# 11. DUPLICATE ATTENDANCE PREVENTION

The database must prevent multiple conflicting attendance records for the same logical attendance event.

Examples of uniqueness dimensions may include:

- student;
- session/date;
- subject/class context.

The exact uniqueness key MUST follow `DATABASE_SCHEMA.md`.

Do not create an over-broad uniqueness constraint that prevents legitimate separate classes/subjects.

Do not use application-only checks as a replacement for required database integrity.

---

# 12. LEAVE APPLICATION

Where `LeaveApplication` is part of the authoritative schema, it must persist the leave request and the approval state necessary for the approved workflow.

The model should support the distinction between:

- requested leave;
- approved leave;
- rejected leave;
- relevant dates/reason;
- student;
- approving faculty where defined.

Exact statuses and field structure must follow the authoritative schema.

IMPORTANT:

A leave application is not automatically equivalent to an attendance record.

The relationship between approved leave and `LEAVE` attendance status must be modeled according to the approved architecture.

Do not create hidden automatic side effects in model `save()` unless explicitly required by the schema.

---

# 13. FACULTY LEAVE AUTHORITY

The database structure must allow the system to record the faculty authority associated with leave approval wherever required.

Do not create:

- student self-approval;
- parent self-approval;
- automatic AI approval;
- principal-only approval when the approved requirement says faculty is the authority.

Actual permission enforcement is a later RBAC/API concern.

This task establishes the data relationship.

---

# 14. ATTENDANCE NOT ENTERED FOUNDATION

The database design must preserve enough information to identify attendance that has not yet been entered.

This requirement is needed later for:

- Faculty scoped "Attendance Not Entered";
- Principal school-wide "Attendance Not Entered".

Do not implement those UI/API endpoints in Task 3.4.

The persistence model must not make "no row exists" indistinguishable from an intentionally recorded absence where the application later needs to identify missing attendance.

The exact representation must follow `DATABASE_SCHEMA.md`.

---

# 15. ABSENTEE FOUNDATION

The data model must support efficient retrieval of students whose attendance status is:

`ABSENT`

for the appropriate scope.

Later roles include:

- Admin;
- Faculty;
- Principal.

Do not implement role-based API filtering in this task.

Do ensure the schema makes the underlying query straightforward.

---

# 16. ATTENDANCE HISTORICAL INTEGRITY

Attendance records represent historical academic information.

Do not allow unrelated student/profile deletion to silently destroy required historical records.

Use appropriate `on_delete` behavior based on ownership and history.

Do not use `CASCADE` everywhere.

Historical implications must be explicitly documented for important relationships.

---

# 17. MARKS MODEL

Marks must follow the Indian-school academic model.

The system uses:

- marks out of 100;
- cumulative marks;
- percentage;
- letter grades.

Do NOT introduce:

- GPA;
- CGPA;
- academic credits;
- 4.0-scale grading;
- credit points.

---

# 18. RAW MARK RULE

A mark entry represents the student's raw academic score.

Default expected range:

`0–100`

The database/domain layer must reject:

- negative marks;
- marks greater than 100.

Do not silently clamp invalid input.

For a missing/non-present result, use the representation defined by `DATABASE_SCHEMA.md`.

Do not invent an `AB` database meaning if the authoritative schema does not define one.

Where `AB` is supported by the project's shared utility, preserve that behavior consistently.

---

# 19. EXAM / ASSESSMENT TYPE

Where the authoritative schema defines `ExamType`, implement it as a separate domain entity rather than repeatedly storing arbitrary exam names on mark rows.

It should support the approved examination structure.

The exact fields, ordering, active state, and academic relationships must follow `DATABASE_SCHEMA.md`.

Do not invent unsupported examination categories.

---

# 20. MARK RELATIONSHIPS

A mark must be attributable to the appropriate:

- student;
- exam/assessment type;
- subject;
- academic context.

Faculty linkage should only be included where explicitly required by the authoritative schema.

Do not duplicate student identity or subject names inside mark records.

Use foreign keys to the canonical entities.

---

# 21. DUPLICATE MARK PREVENTION

The database must prevent multiple conflicting mark records for the same logical assessment.

The uniqueness key should represent the actual business identity of a mark, such as the appropriate combination of:

- student;
- exam type;
- subject;
- academic context.

Do not create a constraint that blocks legitimate retest/reassessment cases if those are explicitly supported.

Follow the schema documentation.

---

# 22. GRADING SCALE

Use the approved 8-tier letter grading scale:

| Percentage | Grade |
|---|---|
| >= 91 | A1 |
| 81–<91 | A2 |
| 71–<81 | B1 |
| 61–<71 | B2 |
| 51–<61 | C1 |
| 41–<51 | C2 |
| 33–<41 | D |
| < 33 | E |

Boundary behavior MUST be exact.

Required tests include:

- 32.99 → E
- 33 → D
- 40.99 → D
- 41 → C2
- 50.99 → C2
- 51 → C1
- 60.99 → C1
- 61 → B2
- 70.99 → B2
- 71 → B1
- 80.99 → B1
- 81 → A2
- 90.99 → A2
- 91 → A1
- 100 → A1

Do not create a second conflicting grading algorithm.

Use the shared domain utility already established in `common/utils.py`.

---

# 23. GRADE DERIVATION

Grade should be deterministically derived from the approved grading utility.

Do NOT recreate the grading thresholds independently in multiple models.

Avoid model `save()` hooks whose only purpose is to duplicate calculation logic.

Where persistence of grade is explicitly required by `DATABASE_SCHEMA.md`, it must remain synchronized and tested.

Otherwise, prefer deterministic derivation from the canonical mark/percentage data.

---

# 24. PERCENTAGE / CUMULATIVE CALCULATION

The database must retain sufficient raw data to calculate:

- subject mark;
- examination result;
- cumulative marks;
- percentage;
- final letter grade where applicable.

Do not store only a final percentage while discarding the raw mark.

Do not replace raw marks with preformatted display strings.

The exact cumulative definition must follow the authoritative schema.

Do not invent exam weighting rules not documented by the project.

---

# 25. STREAM AND SUBJECT COMPATIBILITY

Marks must respect the academic structure already created in Task 3.3.

For senior secondary students:

- stream-specific subjects must remain consistent with the student's academic structure.

Do not implement the complete subject-allocation engine.

At most, enforce structural constraints that clearly belong to the database/domain model.

Complex assignment workflows belong later.

---

# 26. MODEL VALIDATION

Validation may enforce:

- valid attendance status;
- invalid legacy attendance status rejection;
- valid mark range;
- structurally invalid academic relationships;
- impossible date ranges;
- required relationships.

Do not embed large workflow engines in models.

Avoid hidden database writes caused by validation.

---

# 27. DATABASE CONSTRAINTS

Use database-level constraints where the rule is fundamentally relational.

Examples:

- mark range;
- unique attendance event;
- unique mark record;
- valid status;
- valid date ordering;
- required relationship combinations.

Constraints must match the documented schema.

Do not create speculative constraints.

---

# 28. INDEXING

Index common attendance/marks query paths justified by the application.

Potential query dimensions:

Attendance:
- student;
- date/session;
- section/class;
- subject;
- status.

Marks:
- student;
- exam type;
- subject;
- academic context.

Only add indexes with a clear query or uniqueness justification.

Avoid index duplication.

---

# 29. API BOUNDARY

This task is a DATABASE LAYER task.

Do not build:

- attendance CRUD endpoints;
- mark CRUD endpoints;
- role-specific REST endpoints;
- serializers for full API workflows;
- frontend API integration.

Existing DRF scaffolding must continue importing correctly.

Task 3.6 owns the initial REST API foundation.

---

# 30. RBAC BOUNDARY

Do not implement permission classes or role enforcement here.

The following permissions are domain requirements that the data model must support later:

- Faculty manages attendance within assigned scope;
- Faculty handles LEAVE approval/marking;
- Admin/Principal can view absentees;
- Faculty can view scoped absentees;
- Principal/Faculty can identify attendance not entered.

The actual authorization layer belongs to Phase 4.

---

# 31. TESTING REQUIREMENTS

Create deterministic backend tests covering:

## Attendance

- valid status creation;
- each of the four valid statuses;
- rejection of LATE;
- rejection of EXCUSED;
- attendance percentage formula;
- ON_DUTY counted as present;
- LEAVE counted as absence;
- zero-denominator behavior;
- duplicate attendance prevention;
- absentee retrieval foundation;
- attendance-not-entered foundation;
- leave application state;
- faculty approval relationship where defined.

## Marks

- valid mark creation;
- 0 accepted;
- 100 accepted;
- negative rejected;
- >100 rejected;
- duplicate mark prevention;
- exam type relationship;
- subject relationship;
- cumulative calculation;
- percentage calculation;
- grading boundary cases.

## Relationships

- student ↔ attendance;
- student ↔ leave;
- student ↔ mark;
- exam type ↔ mark;
- subject ↔ mark;
- academic context integrity.

## Regression

Existing Task 3.1 and Task 3.3 tests must continue to pass.

Do not weaken tests to make implementation pass.

---

# 32. MIGRATION SCOPE

Task 3.4 may create migrations for the attendance and marks entities assigned to this task.

The migration must NOT unexpectedly include unrelated later domains.

Inspect generated migration files manually.

Verify dependency ordering against Task 3.3 migrations.

Do not overwrite migration history recklessly.

---

# 33. POSTGRESQL VERIFICATION

When PostgreSQL is available:

- apply the migration to a clean database;
- verify constraints;
- verify indexes;
- verify foreign keys;
- run the complete backend test suite.

When PostgreSQL is unavailable:

- distinguish model validation from actual DB validation;
- report the infrastructure limitation honestly;
- do not claim migration execution succeeded.

---

# 34. REQUIRED COMMANDS

At minimum:

```bash
python manage.py check
python manage.py makemigrations
python manage.py makemigrations --check
python manage.py showmigrations
pytest -q