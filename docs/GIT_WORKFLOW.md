# Git Workflow & Commit Governance

> **Status**: Authoritative Version Control Policy  
> **Phase**: Phase 1 (Foundation & Governance)  
> **Last Updated**: 2026-09-23

---

## 1. Branching Strategy

The repository follows a clean, structured branching strategy suited for progressive phase-based development:

```text
main (Production / Verified Phase Releases)
  ▲
  │ (Release PR / Merge)
develop (Integration Branch for Current Phase)
  ▲
  ├── feature/<domain>-<short-description>
  ├── fix/<issue-reference>-<short-description>
  └── docs/<phase-or-topic>
```

### Branch Responsibilities
- **`main`**: Represents the most stable, signed-off release. Only merges from `develop` following comprehensive phase validation.
- **`develop`**: The primary working trunk for the active development phase. All feature and fix branches branch off and merge back into `develop`.
- **`feature/*`**: Scoped branches for implementing specific modules, feature sets, or datasets (e.g. `feature/mock-data-setup`, `feature/student-directory-ui`).
- **`fix/*`**: Scoped branches for bug fixes, test corrections, or lint repairs.
- **`docs/*`**: Dedicated branches for documentation overhauls, phase briefs, or ADR records.

---

## 2. Conventional Commit Standards

Every commit message must follow the **Conventional Commits** specification:

```text
<type>(<scope>): <subject>

[optional body describing why the change was made]

[optional footer(s)]
```

### 2.1 Commit Types
- **`feat`**: A new user feature or dataset introduction.
- **`fix`**: A bug fix or error correction.
- **`docs`**: Documentation changes, README updates, phase status tracking.
- **`style`**: Formatting, white-space, missing semi-colons (no production code change).
- **`refactor`**: Code restructuring without altering external functionality.
- **`test`**: Adding missing tests, correcting test suites.
- **`chore`**: Maintenance, build tool configurations, dependency updates.

### 2.2 Scopes
Scopes must accurately reflect the affected project area:
- `frontend`
- `backend`
- `mock-data`
- `database`
- `infra`
- `docs`
- `deps`

### 2.3 Concrete Examples
```text
feat(mock-data): add attendance dataset with status and session periods
docs: update phase 1 status to complete
feat(frontend): scaffold modular directory layout and vite configuration
fix(frontend): correct navigation links in sidebar layout
chore(infra): add multi-container docker-compose definition
```

---

## 3. Pull Request Guidelines

1. **Title**: Follows conventional commit format (e.g. `feat(mock-data): introduce synthetic datasets for 5 roles`).
2. **Phase Cross-Reference**: Explicitly cite the phase number and acceptance criteria addressed.
3. **Checklist**:
   - [ ] Relevant documentation in `docs/` updated.
   - [ ] Phase status document updated.
   - [ ] Code formatting and linting pass without errors.
   - [ ] No unapproved technologies or directory restructurings introduced.

---

## 4. Repository Hygiene & Ignored Files

To prevent development artifacts from leaking into version control:
- The root `.gitignore` file enforces exclusion of generated Python bytecode (`__pycache__/`, `*.py[cod]`), frontend build caches (`node_modules/`, `dist/`), secrets (`.env`, `.env.*`), and local editor configs (`.vscode/`, `.idea/`).
- Never force-add ignored files (`git add -f`).
- If cached artifacts are generated during testing or compilation, ensure they remain excluded prior to committing.

