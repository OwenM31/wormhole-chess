# Changelog

All notable changes to the Coding Harness will be documented in this file.

## [1.0.0] - 2026-10-13

### Added
- Standardized `.agent/` architecture (`workflows/`, `skills/`, `harness/`, `state/`).
- 25 specialized workflows supporting full product lifecycle:
  - Spec & Milestone definition (`/new-project`, `/new-milestone`, `/complete-milestone`, `/audit-milestone`).
  - Phase planning and research (`/plan`, `/discuss-phase`, `/research-phase`, `/web-search`, `/list-phase-assumptions`).
  - Wave execution and verification (`/execute`, `/verify`, `/plan-milestone-gaps`).
  - Session state hygiene (`/pause`, `/resume`, `/progress`).
  - Systematic debugging with 3-strike escalation (`/debug`).
  - Quick task capture (`/add-todo`, `/check-todos`).
  - Utilities (`/help`, `/update`, `/whats-new`).
- 11 specialized agent skills:
  - Core: `planner`, `plan-checker`, `executor`, `verifier`, `debugger`.
  - Context & token management: `context-fetch`, `context-compressor`, `token-budget`, `context-health-monitor`.
  - Quality assurance: `empirical-validation`, `codebase-mapper`.
- 21 canonical templates for specs, plans, summaries, roadmaps, states, and verification reports.
- Comprehensive documentation and operational guides:
  - `model-selection-playbook.md`
  - `token-optimization-guide.md`
  - `runbook.md`
- Cross-platform PowerShell (`.ps1`) and Bash (`.sh`) search and validation scripts.
- Core Engineering Principles (KISS with primitive decomposition, YAGNI, Rule of Three, Fail Fast, Boy Scout with `/add-todo`, Design for Deletion).
