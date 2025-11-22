# Quick Start Guide: Developer-Specific Scheduling

## Setup (Step 1: Configure)

### 1. Configure Sprint Dates
- Set sprint start and end dates
- Configure work days (default: Mon-Fri)
- Add company holidays

### 2. Add Team Members
Click "Add Developer" and enter:
- **Name:** Developer's name
- **Role:** Their role/title
- **Daily Capacity:** Hours available per day (usually 6-8)
- **👀 Reviewer Checkbox:** Check if this developer can perform code reviews

> **💡 Tip:** Only experienced developers should be marked as reviewers

### 3. Configure Developer Capacity (Optional)
Click on any developer in the capacity calendar to:
- Add PTO dates (full days off)
- Set custom hours for specific days
- View their total capacity for the sprint

## Add Tasks (Step 2: Tasks)

### Import from CSV
Upload a CSV with these columns:
- Issue key
- Summary
- Priority (Critical, High, Medium, Low)
- Research Hours
- Development Hours
- Code Review Hours
- Review Feedback Hours
- Defect Correction Hours
- QA Hours
- Dependencies (comma-separated task IDs)

### Add Manually
Click "Add Task" and enter:
- **Task ID:** Unique identifier (e.g., JIRA-123)
- **Summary:** Brief description
- **Priority:** Critical → High → Medium → Low
- **Work Breakdown:** Hours for each phase
- **Dependencies:** Other task IDs this depends on

## Review & Generate (Steps 3-4)

### Review Configuration
Check the summary to ensure:
- ✅ All developers are configured with correct capacity
- ✅ Reviewers are properly marked
- ✅ All tasks have realistic hour estimates
- ✅ Dependencies are correct

### Generate Timeline
Click "Generate Timeline" to see:

1. **Gantt Timeline** - Traditional task-focused view
2. **Developer Timeline** - Per-developer horizontal view with idle time
3. **Daily Calendar Grid** - Expandable day-by-day breakdown

## Understanding the Developer Timeline

### Utilization Cards
Each developer shows:
- **Work:** Total hours assigned
- **Idle:** Capacity - Work hours
- **Idle %:** What percentage of time is unallocated

**Warning Levels:**
- 🟢 Low (<20% idle): Good utilization
- 🟡 Medium (20-40% idle): Moderate utilization
- 🔴 High (>40% idle): Consider assigning more work

### Timeline Grid
- Each row = one developer
- Each column = one day
- **Colored blocks** = Work items (hover for details)
- **Gray blocks** = Idle time
- **Hour labels** = Hours worked on each item

**Work Type Colors:**
- 🔍 Purple = Research
- 💻 Blue = Development
- 👀 Pink = Code Review
- 🔄 Orange = Review Feedback
- 🐛 Red = Defect Correction
- ✅ Green = QA
- ⏱️ Gray = Context Switch (1h penalty)

### Filters
- **All Developers:** See everyone's schedule
- **Individual:** Select one developer to focus on
- **Show Idle Time:** Toggle idle time display

## Using the Daily Calendar Grid

### Day View
Click any day to expand and see:
- Which developers are working
- What tasks they're assigned
- How many hours per task
- Idle time for each developer

### Idle Time Alerts
Yellow warnings appear when:
- Developer has idle hours for that day
- Suggestion: "Consider assigning additional tasks"

### Sprint Summary
Bottom panel shows:
- Total work days
- Total work hours (all developers combined)
- Total idle hours (opportunity for more work)

## Exporting Schedules

Click "📥 Export" in the header to access:

### 1. 📊 All Developers
**File:** `developer_schedules_{date}.csv`
**Contains:** Daily breakdown for all developers with idle time
**Use For:** Daily standups, team status meetings

### 2. 📋 Task-Focused
**File:** `task_completion_{date}.csv`
**Contains:** When each task starts and ends
**Use For:** Stakeholder reports, milestone tracking

### 3. 👤 Individual CSVs
**Files:** One CSV per developer (`{date}_{name}_schedule.csv`)
**Contains:** 
- Summary header (total work, idle, idle %)
- Daily breakdown of their work
- Idle days marked
**Use For:** Giving each developer their personal schedule

### 4. 📈 Utilization Summary
**File:** `developer_utilization_{date}.csv`
**Contains:**
- Work hours, idle hours, idle %
- Tasks assigned count
- Utilization % (100 - idle %)
**Use For:** Management reports, capacity planning

### 5. 📝 Classic Export
**File:** `sprint_plan_{date}.csv`
**Contains:** Original task-based export format
**Use For:** Backward compatibility

## Key Features Explained

### ⏱️ Context Switching Penalty
**What:** 1-hour overhead when switching between different work types
**Why:** Accounts for mental context switching costs
**Example:**
- Developer finishes Development (2pm)
- Next task is Code Review
- System adds 1-hour switch time (2pm-3pm)
- Code Review starts at 3pm

**Smart Grouping:**
The algorithm batches similar work:
- Reviews together (Code Review + Review Feedback)
- Bugs together (Defect Correction)
- Development work together (Research + Development)

### 👀 Code Review Assignment
**What:** Only developers marked as "Can Review" get code review tasks
**Why:** Ensures quality by using experienced reviewers
**Setup:** Check the "👀 Reviewer" box when adding/editing developers

**In CSV:**
```csv
Name,Role,Daily Capacity (hours),Can Review
Alice,Senior Dev,8,true
Carol,Junior Dev,6,false
```

### 📊 Idle Time Tracking
**What:** Shows when developers have available capacity
**Calculation:**
```
Daily Capacity = 8 hours
Assigned Work = 5 hours
Idle Time = 3 hours (37.5% idle)
```

**What Affects Capacity:**
- ✅ Daily capacity setting
- ✅ PTO dates (0 hours capacity)
- ✅ Holidays (0 hours capacity)
- ✅ Custom hours (override default)
- ✅ Work days configuration

## Best Practices

### Setting Up Team
1. Mark 2-3 senior developers as reviewers
2. Set realistic daily capacity (6-7 hours for coding time)
3. Configure PTO in advance
4. Use custom hours for half-days or meetings

### Managing Tasks
1. Break large tasks into smaller work items
2. Set realistic hour estimates
3. Use dependencies to sequence work
4. Prioritize critical path tasks

### Optimizing Utilization
1. **High Idle Time (>40%):**
   - Add more tasks
   - Reduce team size
   - Check if tasks are blocked by dependencies

2. **Low Idle Time (<10%):**
   - Good utilization!
   - Watch for overallocation on specific days
   - Leave some buffer for unplanned work

3. **Context Switching:**
   - Group similar tasks together
   - Minimize work type changes
   - Let algorithm batch reviews

### Using Exports
- **Daily Standups:** Use "All Developers" export
- **Sprint Planning:** Use "Task-Focused" export
- **1-on-1s:** Use "Individual CSVs"
- **Management Reports:** Use "Utilization Summary"

## Troubleshooting

### "No reviewers available for code review"
**Fix:** Mark at least one developer with "Can Review" checkbox

### "Developer has 80% idle time"
**Possible Causes:**
- Not enough tasks
- Tasks assigned to other developers
- Developer on PTO most of sprint
- Skill mismatch (only they can review but no reviews needed)

### "Context switch penalty seems high"
**Explanation:** Each work type change adds 1 hour
**Reduce By:**
- Combine similar task phases
- Reduce granularity of work breakdown
- Let algorithm batch similar work

### "Export doesn't show idle time"
**Fix:** Use "All Developers" or "Individual CSVs" export
(Task-Focused export doesn't include idle time)

## Keyboard Shortcuts

- **Expand/Collapse Day:** Click date header
- **Filter Developer:** Use dropdown
- **Export Menu:** Click export button

## Tips & Tricks

### 💡 Quick Idle Time Check
Look for gray blocks in the timeline - that's idle time!

### 💡 Find Overallocated Days
Look for very tall columns in the daily grid

### 💡 Balance Team Load
Compare utilization cards - aim for similar idle %

### 💡 Prioritize Critical Work
System schedules Critical → High → Medium → Low automatically

### 💡 Account for Meetings
Set daily capacity to 6-7 hours (not 8) to account for standup, email, etc.

### 💡 Leave Buffer Time
Target 10-20% idle time as buffer for:
- Unplanned work
- Production issues
- Support requests
- Code review delays

## Example Workflow

1. **Monday Morning:** Import team from CSV, configure sprint dates
2. **Configure Capacity:** Add known PTO, set custom hours for half-days
3. **Import Tasks:** Upload JIRA export CSV
4. **Review Setup:** Check team summary, validate task estimates
5. **Generate Timeline:** Click through to see Gantt, Developer Timeline, Daily Grid
6. **Export Individual:** Send each developer their personal schedule
7. **Monitor Daily:** Use Daily Grid to track progress during sprint
8. **End of Sprint:** Export Utilization Summary for retrospective

## Getting Help

### Sample Files
Check the `samples/` folder for:
- `team_roster_example.csv` - Team CSV format
- `jira_tasks_example.csv` - Task CSV format

### Documentation
- `DEVELOPER_SCHEDULING_FEATURES.md` - Technical details
- `README.md` - Project overview
- `FAQ` page - Common questions

### Common Questions

**Q: Can I manually reassign tasks?**
A: Not yet - this is a planned feature. Currently the algorithm auto-assigns.

**Q: What if a developer is only available part-time?**
A: Set their daily capacity to match (e.g., 4 hours for half-time)

**Q: Can I see who's reviewing whose code?**
A: Yes! Code review tasks show assignee and which task is being reviewed

**Q: How does it handle dependencies?**
A: Uses topological sort - dependent tasks wait until dependencies complete

**Q: What if I change the team after generating the timeline?**
A: Click "← Back to Review" then "Generate Timeline" again to re-schedule

---

**Need more help?** Check the FAQ page or review the technical documentation!
