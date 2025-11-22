# Sprint Task Distributor – Architecture Overview

## High-Level Modules
| Area | Description |
| --- | --- |
| `pages/` | Next.js page entry points. `pages/index.tsx` hosts the full sprint planning workflow. |
| `src/components/` | Presentation + interaction components (Team roster, task manager, timelines, calendars, reassignment UI). |
| `src/lib/` | Pure logic helpers (scheduler, CSV parsing, export utilities). |
| `src/hooks/` | Custom React hooks, e.g., localStorage helpers. |
| `__tests__/` | Jest unit tests covering critical scheduling logic. |

## Data Flow
1. **Input:** Users configure sprint dates, team capacity, PTO, and tasks (import CSV or manual).
2. **Scheduling:** `schedulerEnhanced.ts` computes workloads using dependency resolution, priority ordering, code-review capability checks, and context-switch penalties.
3. **Visualization:** `DeveloperTimeline`, `DailyCalendarGrid`, and `TaskReassignment` render per-developer schedules, idle time, and manual overrides.
4. **Export:** `exportSchedules.ts` converts schedule summaries into CSVs (all developers, task-focused, per-developer, utilization).

## Scheduler Highlights
- Topological sorting for dependency-safe ordering.
- Priority-aware assignment (Critical → Low).
- Context switch penalty (1h) when switching work-type categories.
- Reviewer-only assignment for code review tasks.
- Per-day capacity tracking with PTO, holidays, and custom hours.
- Idle time calculation per developer/day + aggregated metrics.

## Testing Strategy
- Jest with ts-jest for TypeScript.
- Core focus on library modules (`schedulerEnhanced`, CSV parsers, exports).
- Future work: integrate React Testing Library for UI smoke tests.

## Manual Overrides
- `TaskReassignment` component surfaces current assignments.
- Hook up to scheduler by persisting overrides and re-running scheduling with constraints.

## Future Enhancements
- Persist overrides server-side (e.g., API + database).
- Add visual regression tests for timelines.
- Introduce feature flags for experimental schedulers.
