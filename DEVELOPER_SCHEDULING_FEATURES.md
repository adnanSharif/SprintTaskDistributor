# Developer-Specific Scheduling Features

## Overview
This document outlines the advanced developer-specific task distribution features implemented in the Sprint Task Distributor application.

## Key Features

### 1. Code Review Flag
**Location:** Team Roster Configuration
- Added `canReview` boolean flag to each developer
- Only developers with `canReview=true` can be assigned code review tasks
- UI includes checkbox with tooltip: "Can perform code reviews for other developers"
- Modal includes explanation: "Only experienced developers should review others' code"
- CSV format updated: New column "Can Review" (true/false or 1/0)

**Sample CSV:**
```csv
Name,Role,Daily Capacity (hours),Can Review
Alice,Senior Dev,8,true
Bob,Mid-level Dev,7,true
Carol,Junior Dev,6,false
```

### 2. Context Switching Penalty
**Location:** `src/lib/schedulerEnhanced.ts`
- **Penalty:** 1 hour when switching between different work types
- **Smart Grouping:** Similar work types are grouped together:
  - Code reviews, review feedback (reviews)
  - Defect correction, bug fixes (bugs)
  - Research, development (normal development work)
- **Recording:** Context switch penalty is recorded as a work item in schedules
- **Priority Interruption:** Higher or equal priority reviews can interrupt current work

**Algorithm Logic:**
```typescript
CONTEXT_SWITCH_PENALTY = 1 hour

needsContextSwitch(currentType, newType):
  - Groups similar types (reviews together, bugs together)
  - Returns true if switching between different groups
  - Adds 1h penalty when switching
```

### 3. Idle Time Tracking
**Location:** `generateDeveloperSchedules()` in `schedulerEnhanced.ts`

**Per Developer Calculation:**
- **Total Work Hours:** Sum of all assigned work hours
- **Total Idle Hours:** Capacity - Work Hours across sprint
- **Idle Percentage:** (Idle Hours / Total Capacity) × 100
- **Per-Day Breakdown:** Shows work vs idle for each day

**Idle Time Detection:**
- Calculates available capacity for each day (considering PTO, holidays, custom hours)
- Tracks actual work hours assigned per day
- Difference = Idle time for that day
- Aggregates to show total idle time and percentage

### 4. Developer Timeline View
**Component:** `src/components/DeveloperTimeline.tsx`

**Features:**
- **Per-Developer Gantt Rows:** Each developer has their own timeline row
- **Date Range Header:** Shows all sprint dates with weekday labels
- **Work Type Color Coding:**
  - 🔍 Research: Purple (#8b5cf6)
  - 💻 Development: Blue (#3b82f6)
  - 👀 Code Review: Pink (#ec4899)
  - 🔄 Review Feedback: Orange (#f59e0b)
  - 🐛 Defect Correction: Red (#ef4444)
  - ✅ QA: Green (#10b981)
  - ⏱️ Context Switch: Gray (#9ca3af)
- **Idle Time Indicators:** Gray badges showing idle hours per day
- **Utilization Summary Cards:** Shows work/idle hours and percentage
- **Idle Warning Levels:**
  - High (>40%): Yellow border warning
  - Medium (20-40%): Standard display
  - Low (<20%): Good utilization
- **Filter Options:** View all developers or select individual
- **Toggle:** Show/hide idle time

### 5. Daily Calendar Grid
**Component:** `src/components/DailyCalendarGrid.tsx`

**Features:**
- **Expandable Days:** Click to expand and see detailed breakdown
- **Per-Developer Daily Schedule:** Shows all work items for each dev each day
- **Work Type Badges:** Color-coded tags for each work type
- **Idle Time Alerts:** Yellow warning when developer has idle hours
- **Summary Statistics:**
  - Total work days
  - Total work hours (all developers)
  - Total idle hours (all developers)
- **Weekend Highlighting:** Gray background for weekends
- **Daily Totals:** Shows work/idle hours per developer per day

### 6. Multi-Format Export System
**Location:** `src/lib/exportSchedules.ts`

#### Export Format 1: All Developers (Daily Breakdown)
**File:** `developer_schedules_{date}.csv`

**Columns:**
- Developer
- Date (with weekday)
- Task ID
- Task Summary
- Work Type
- Hours
- Daily Total Hours
- Idle Hours

**Use Case:** Detailed daily view for all developers, useful for daily standups

#### Export Format 2: Task-Focused Schedule
**File:** `task_completion_{date}.csv`

**Columns:**
- Developer
- Task ID
- Task Summary
- Work Type
- Start Date
- End Date
- Hours

**Use Case:** See when tasks will be completed, useful for stakeholder reporting

#### Export Format 3: Individual Developer CSVs
**Files:** `{date}_{developer_name}_schedule.csv` (one per developer)

**Features:**
- **Summary Header:** Total Work Hours | Idle Hours | Idle %
- **Daily Breakdown:** Date, Task ID, Summary, Work Type, Hours
- **Idle Days:** Shows days with "(No work scheduled)"
- **Daily Totals:** Work hours and idle hours per day

**Use Case:** Give each developer their personal schedule

#### Export Format 4: Utilization Summary
**File:** `developer_utilization_{date}.csv`

**Columns:**
- Developer
- Total Work Hours
- Total Idle Hours
- Idle Percentage
- Tasks Assigned
- Utilization Percentage (100 - Idle %)

**Use Case:** Management overview of team utilization

### 7. Export UI
**Location:** Header dropdown in Timeline view

**UI Features:**
- Dropdown menu with all export options
- Icons and descriptions for each format
- Tooltips explaining each export type
- Classic export option for backward compatibility

**Export Options:**
1. 📊 All Developers - Daily breakdown with idle time
2. 📋 Task-Focused - Task completion dates
3. 👤 Individual CSVs - Separate file per developer
4. 📈 Utilization Summary - Idle % and task count
5. 📝 Classic Export - Original format

## Enhanced Scheduling Algorithm

### Core Improvements (`schedulerEnhanced.ts`)

**1. Day-Level Granular Tracking:**
```typescript
dayAllocations: { date: string; hours: number }[]
```
- Tracks exactly which days and how many hours for each work item
- Enables accurate idle time calculation
- Supports work items spanning multiple days

**2. Code Review Assignment:**
```typescript
if (workItem.needsReviewer) {
  availableDevs = developers.filter(d => d.canReview);
}
```
- Filters developers by `canReview` flag
- Ensures only qualified reviewers are assigned code reviews
- Prevents junior developers from being assigned review tasks

**3. Context Switch Detection:**
```typescript
needsContextSwitch(prevType, newType):
  - Checks if work types are in different categories
  - Research/Development = Category A
  - Code Review/Review Feedback = Category B
  - Defects/Bugs = Category C
  - Returns true if switching categories
```

**4. Developer Schedule Generation:**
```typescript
generateDeveloperSchedules(schedule, developers, sprintConfig):
  For each developer:
    1. Collect all assigned work items
    2. Build daily schedule with work items per day
    3. Calculate daily capacity (PTO, holidays, custom hours)
    4. Calculate idle time = capacity - work hours
    5. Build task assignment list with date ranges
    6. Calculate totals and percentages
```

## Data Flow

### Scheduling Workflow:
1. User configures sprint (dates, holidays, work days)
2. User adds team members with `canReview` flag and capacity
3. User configures per-developer PTO and custom hours
4. User adds tasks with work breakdown
5. Algorithm runs:
   - Topological sort for dependencies
   - Priority-based assignment
   - Code review filtering (canReview=true only)
   - Context switch penalty tracking
   - Day-by-day allocation
6. Generate developer schedules with idle calculation
7. Display in UI:
   - Gantt timeline (task-focused)
   - Developer timeline (per-dev horizontal view)
   - Daily calendar grid (expandable days)
8. Export in multiple formats

### Type System:

**DeveloperScheduleSummary:**
```typescript
interface DeveloperScheduleSummary {
  developerId: string;
  developerName: string;
  totalWorkHours: number;
  totalIdleHours: number;
  idlePercentage: number;
  dailySchedule: DeveloperDaySchedule[];
  taskAssignments: TaskAssignment[];
}
```

**DeveloperDaySchedule:**
```typescript
interface DeveloperDaySchedule {
  date: string; // YYYY-MM-DD
  workItems: WorkItemDetail[];
  totalHours: number; // Work hours for the day
  idleHours: number; // Idle hours for the day
}
```

## UI Components

### DeveloperTimeline.tsx
- **Purpose:** Per-developer horizontal timeline view
- **Key Features:** Gantt-style rows, idle time visualization, utilization cards
- **Interactions:** Filter by developer, toggle idle time display

### DailyCalendarGrid.tsx
- **Purpose:** Day-by-day breakdown across all developers
- **Key Features:** Expandable days, work type badges, idle alerts
- **Interactions:** Click to expand day, see all developers' work for that day

### Export Functions (exportSchedules.ts)
- **Purpose:** Multiple CSV export formats
- **Key Features:** Daily breakdown, task completion, individual CSVs, utilization summary
- **Integration:** Dropdown menu in header

## Configuration

### Team Roster CSV Format:
```csv
Name,Role,Daily Capacity (hours),Can Review
Alice,Senior Dev,8,true
Bob,Mid-level Dev,7,true
Carol,Junior Dev,6,false
Dave,Senior Dev,8,true
Emma,Junior Dev,5,false
```

### Developer Capacity Calendar:
- PTO dates (full days off)
- Custom hours per day (override default capacity)
- Visual calendar with date picker
- Automatically reduces capacity for holidays

## Business Value

### 1. Resource Optimization
- Identify underutilized developers (high idle %)
- Rebalance work to improve utilization
- Prevent burnout by tracking actual work hours

### 2. Quality Assurance
- Ensure only qualified developers review code
- Maintain code quality standards
- Track review capacity separately

### 3. Productivity
- Minimize context switching overhead
- Batch similar work types together
- Account for switching costs in estimates

### 4. Transparency
- Individual schedules for each developer
- Clear visibility into idle time
- Multiple reporting formats for different stakeholders

### 5. Planning Accuracy
- Day-level granular scheduling
- Consider holidays, PTO, custom hours
- Realistic estimates with context switching

## Future Enhancements (Not Yet Implemented)

### Manual Task Assignment Override
- Drag-and-drop to reassign tasks
- Override algorithm suggestions
- Preserve custom assignments

### Rebalancing Suggestions
- Detect high idle time (>40%)
- Suggest task reassignments
- Auto-rebalance option

### Additional Tooltips
- Hover over work items for full details
- Dependency indicators in timeline
- Priority badges on tasks

### Visual Enhancements
- Animated transitions
- Interactive filters
- Zoom controls for timeline
- Export to PDF/Image

## Testing

### Test Scenarios:

**1. Code Review Assignment:**
- ✅ Only developers with canReview=true get code reviews
- ✅ Code reviews are distributed among reviewers
- ✅ Non-reviewers never get review tasks

**2. Context Switching:**
- ✅ 1-hour penalty when switching work types
- ✅ Similar work batched together (reviews, bugs, dev)
- ✅ Penalty recorded in schedule

**3. Idle Time Calculation:**
- ✅ Accurate daily idle hours
- ✅ Considers PTO, holidays, custom hours
- ✅ Percentage calculation correct

**4. Export Formats:**
- ✅ All 4 export formats generate valid CSVs
- ✅ Individual CSVs include summary header
- ✅ Utilization summary shows correct percentages

## Troubleshooting

### Issue: High Idle Time for Some Developers
**Cause:** Not enough tasks or unbalanced skill requirements
**Solution:** 
- Add more tasks
- Adjust task estimates
- Enable more developers for code review

### Issue: Context Switch Penalties Too High
**Cause:** Frequent work type changes
**Solution:**
- Adjust task breakdown (combine similar work)
- Manually batch review tasks
- Reduce work type granularity

### Issue: Code Reviews Not Assigned
**Cause:** No developers with canReview=true
**Solution:**
- Enable canReview for experienced developers
- Check team roster configuration

## Summary

The developer-specific scheduling features provide comprehensive visibility into:
- Who is working on what and when
- How efficiently developers are utilized
- Where context switching creates overhead
- Which developers can perform code reviews
- When idle time can be filled with additional work

These features enable better resource planning, improved team utilization, and more accurate sprint estimates.
