# Development Workflow & Governance Protocol

> **Status**: Authoritative Operating Procedure  
> **Mandatory For**: All Human Engineers & AI Coding Agents  
> **Phase**: Phase 1 (Foundation & Governance)  
> **Last Updated**: 2026-09-23

---

## 1. The Mandatory Development Sequence

Every developer and AI agent working on the Student ERP codebase MUST strictly follow this linear execution loop:

```text
1. Understand Task
   └── Fully comprehend the prompt, objectives, constraints, and forbidden practices.
       ↓
2. Read Required Documentation
   └── Inspect docs/PROJECT_STRUCTURE.md, docs/ARCHITECTURE.md, docs/RBAC_PERMISSIONS.md, etc.
       ↓
3. Read Phase Prompt
   └── Read docs/phase_prompts/PHASE_XX.md for the active phase scope.
       ↓
4. Read Current Phase Status
   └── Read docs/phases/PHASE_XX_STATUS.md to understand what is complete, partial, or blocked.
       ↓
5. Inspect Existing Implementation
   └── Run file listings, view code files, inspect tests and configs before touching anything.
       ↓
6. Implement Focused Change
   └── Write clean, robust, modular code strictly adhering to established architectural patterns.
       ↓
7. Test
   └── Run linters, unit tests, integration tests, or schema validators to verify correctness.
       ↓
8. Inspect Changed Files
   └── Review diffs to confirm no extraneous files or unintentional regressions were introduced.
       ↓
9. Update Documentation
   └── Update affected markdown documents in docs/ reflecting new or modified behavior.
       ↓
10. Update Phase Status
    └── Update docs/phases/PHASE_XX_STATUS.md with exact completed/incomplete items.
        ↓
11. Update Changelog / Decisions
    └── Add entries to docs/CHANGELOG.md and docs/DECISIONS.md when architectural choices are made.
        ↓
12. Verify Architecture
    └── Check folder boundaries, technology stack compliance, and absence of competing trees.
        ↓
13. Report Exact Result
    └── Provide the final structured summary adhering to the required response template.
```

---

## 2. Rules of Engagement

1. **No Silent Refactoring**: Never restructure folders or replace libraries simply because another pattern seems preferable.
2. **Phase Boundary Discipline**: Do not leak future phase requirements into the current phase. Implement solely what the active phase requires.
3. **Documentation Continuity**: Code and documentation must move in lockstep. A task is NEVER complete until the relevant documentation and status files are fully updated.
4. **Validation Integrity**: Never claim a task or phase is `COMPLETE` without executing concrete validation commands and reviewing output.
