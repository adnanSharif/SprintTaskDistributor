# Sprint Task Distributor

Advanced sprint planning application with task dependency management, developer capacity calendars, per-developer timelines, and idle-time aware scheduling.

## 🚀 Features

### ✅ Sprint Configuration
- Date range selection (start/end dates)
- Custom work days (Mon-Fri default, fully configurable)
- Company-wide holidays tracking

### 👥 Developer Management
- Team roster with CSV import/export
- Individual daily capacity configuration
- PTO date tracking per developer
- Custom capacity overrides (e.g., 4h half-day, 2h for meetings)
- Browser localStorage persistence

### 📋 Task Management
- **Work Type Breakdown:**
  - 🔍 Research
  - 💻 Development
  - 👀 Code Review
  - 🔄 Review Feedback
  - 🐛 Defect Correction
  - ✅ QA Testing (optional)
- Priority levels (Critical, High, Medium, Low)
- Task dependencies (Task B blocks Task C)
- Internal workflow dependencies (Research → Dev → Review → Feedback)
- Manual task creation with rich modal UI
- CSV import with comprehensive format (tasks + team roster reviewer flag)

### 🧑‍💻 Developer Experience
- Developer-specific timeline with idle-time highlights
- Daily calendar grid with expandable per-day details
- Manual task reassignment UI with reviewer eligibility rules
- Context-switch penalty tracking (1h) to encourage batched work types
- Reviewer-only code review assignment to maintain quality gates

### 🤖 Intelligent Scheduling Algorithm
- Dependency-aware task scheduling (topological sort)
- Priority-based assignment
- Per-day, per-developer capacity tracking
- Holiday and PTO consideration
- Work-type balancing across team
- Critical path optimization

### 📊 Gantt Timeline View
- Visual timeline with date headers
- Task and work-item bars
- Color-coded by work type
- Scheduled start/end dates
- Identifies tasks that won't fit in sprint
- Scheduling conflict warnings

### 📥📤 CSV Import/Export
- Updated format with work breakdown columns + reviewer capability flag
- Task dependencies support (semicolon-separated IDs)
- Export scheduled plan with completion dates
- All-developers daily export, task-focused export, per-developer CSVs, and utilization summary

## 🛠️ Tech Stack

- **Framework**: Next.js 15.5.6 (Pages Router)
- **Language**: TypeScript 5.7.2 (strict mode)
- **UI**: React 18.3.1 with 'use client' directives
- **CSV**: PapaParse 5.4.1
- **State**: localStorage with custom hooks
- **Styling**: CSS-in-JS with CSS variables, gradient backgrounds

## 🏁 Getting Started

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Run tests (Jest)
npm test
```

Open [http://localhost:3000](http://localhost:3000)

## 📖 Usage Workflow

### 1️⃣ Configure (Step 1)
- Set sprint start/end dates
- Define work days and holidays
- Add team members or import from CSV
- Configure individual PTO dates
- Set custom capacity for specific days (half-days, meetings, etc.)

### 2️⃣ Tasks (Step 2)
- Import tasks from CSV or add manually
- Break down work into types (Research, Dev, Review, Feedback, QA)
- Define task dependencies (which tasks block others)

### 3️⃣ Review (Step 3)
- Validate sprint configuration
- Review team capacity summary
- Check total work hours breakdown

### 4️⃣ Timeline (Step 4)
- Generate Gantt chart with auto-scheduling
- View task assignments and dates
- Identify unscheduled tasks
- Export plan to CSV

## 📊 CSV Format

### Tasks CSV
```csv
Issue key,Summary,Priority,Research Hours,Development Hours,Code Review Hours,Review Feedback Hours,Defect Correction Hours,QA Hours,Dependencies
TASK-101,User Authentication API,Critical,4,16,2,4,8,6,
TASK-102,Database Schema Migration,High,8,12,2,3,6,4,
TASK-103,Dashboard UI Components,High,2,20,3,5,10,8,TASK-101
TASK-104,Search Functionality,Medium,6,14,2,4,6,5,TASK-101;TASK-102
```

### Team CSV
```csv
Name,Role,Daily Capacity (hours),Can Review
Alice Johnson,Dev,8,true
Bob Martinez,Dev,7,true
Carol Singh,Dev,6,false
```

## 🧠 Algorithm Features

- **Topological Sort**: Ensures internal/external dependencies are respected
- **Capacity Tracking**: Real-time availability per developer per day (PTO + holidays)
- **Reviewer Gating**: Only `canReview` developers receive code review assignments
- **Context Switching Penalty**: Deducts 1 hour when switching work-type categories
- **Work Type Sequencing**: Automatic Research → Dev → Review → Feedback flow
- **Idle Detection**: Computes daily idle hours + utilization per developer
- **Unscheduled Detection**: Identifies work that won't fit in sprint
- **Exports**: Generates all-developer, per-task, per-dev, and utilization CSVs

## 📁 Project Structure

```
SprintTaskDistributor/
├── pages/
│   ├── index.tsx               # Main app (4-step workflow)
│   ├── faq.tsx                 # FAQ page
│   └── api/                    # API routes (Google Sheets)
├── src/
│   ├── components/
│   │   ├── SprintConfig.tsx       # Sprint dates, holidays, work days
│   │   ├── TeamRoster.tsx         # Team management + reviewer flag
│   │   ├── DeveloperCapacityCalendar.tsx  # PTO & custom hours
│   │   ├── TaskManager.tsx        # Task CRUD with dependencies
│   │   ├── GanttTimeline.tsx      # Visual timeline view
│   │   ├── DeveloperTimeline.tsx  # Per-developer timeline + idle view
│   │   ├── DailyCalendarGrid.tsx  # Expandable day-by-day schedule
│   │   └── TaskReassignment.tsx   # Manual assignment overrides
│   ├── lib/
│   │   ├── schedulerEnhanced.ts   # Idle-aware scheduling algorithm
│   │   ├── csv.ts                 # CSV parsing
│   │   └── exportSchedules.ts     # Multi-format CSV exports
│   ├── types/
│   │   └── index.d.ts          # TypeScript definitions
│   └── hooks/
│       └── useLocalStorage.ts  # Persistence hook
├── samples/
│   ├── jira_tasks_example.csv  # Example task format
│   └── team_roster_example.csv # Example team format (with reviewer flag)
└── styles/
  └── globals.css             # Global styles

```

## 🎯 Use Cases

- **Sprint Planning**: Plan 2-week sprints with realistic capacity
- **Dependency Management**: Handle complex task dependencies
- **Capacity Planning**: Account for PTO, meetings, and variable availability
- **Timeline Visualization**: See when tasks will be completed
- **Team Coordination**: Distribute work fairly across developers
- **QA Handoff**: Plan when tasks will be ready for testing

## 🧪 Testing & CI

- **Unit tests** powered by Jest + ts-jest (`npm test`)
- Coverage reports available via `npm test -- --coverage`
- GitHub Actions workflow (`.github/workflows/ci.yml`) runs lint + tests on every push/PR

## 🔮 Future Enhancements

- Google Sheets live integration
- PWA support (offline mode)
- Skill-based task matching
- JIRA direct API integration
- Persisted manual task overrides in scheduler
- Real-time collaboration
- Multiple roles (Dev, QA, DevOps)
- Resource conflict detection

## 📚 Additional Docs

- `docs/ARCHITECTURE.md` – Module breakdown and scheduler details
- `DEVELOPER_SCHEDULING_FEATURES.md` – Deep dive into developer-specific scheduling
- `QUICK_START_GUIDE.md` – Step-by-step usage guide for sprint planners

## 📝 License

MIT

## 🤝 Contributing

Contributions welcome! Please fork and submit pull requests.

---

Built with ❤️ using Next.js, TypeScript, and React

