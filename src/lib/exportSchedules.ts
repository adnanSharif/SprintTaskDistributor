import Papa from 'papaparse';
import { DeveloperScheduleSummary, Developer } from '../types/index.d';

// Export all developers in one file with comprehensive details
export function exportAllDevelopersSchedule(
  schedules: DeveloperScheduleSummary[],
  filename: string = 'all_developers_schedule.csv'
) {
  const rows: any[] = [];

  schedules.forEach(devSchedule => {
    devSchedule.dailySchedule.forEach(daySchedule => {
      if (daySchedule.workItems.length > 0) {
        daySchedule.workItems.forEach(workItem => {
          rows.push({
            'Developer': devSchedule.developerName,
            'Date': new Date(daySchedule.date).toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' }),
            'Task ID': workItem.taskId,
            'Task Summary': workItem.taskSummary,
            'Work Type': getWorkTypeLabel(workItem.workType),
            'Hours': workItem.hours,
            'Daily Total Hours': daySchedule.totalHours,
            'Idle Hours': daySchedule.idleHours
          });
        });
      } else if (daySchedule.totalHours === 0 && daySchedule.idleHours > 0) {
        // Day with no work
        rows.push({
          'Developer': devSchedule.developerName,
          'Date': new Date(daySchedule.date).toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' }),
          'Task ID': '',
          'Task Summary': '(No tasks scheduled)',
          'Work Type': '',
          'Hours': 0,
          'Daily Total Hours': 0,
          'Idle Hours': daySchedule.idleHours
        });
      }
    });
  });

  const csv = Papa.unparse(rows);
  downloadCSV(csv, filename);
}

// Export task-focused view (when tasks are completed, not daily breakdown)
export function exportTaskFocusedSchedule(
  schedules: DeveloperScheduleSummary[],
  filename: string = 'task_focused_schedule.csv'
) {
  const rows: any[] = [];

  schedules.forEach(devSchedule => {
    devSchedule.taskAssignments.forEach(task => {
      rows.push({
        'Developer': devSchedule.developerName,
        'Task ID': task.taskId,
        'Task Summary': task.summary,
        'Work Type': getWorkTypeLabel(task.workType),
        'Start Date': new Date(task.startDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
        'End Date': new Date(task.endDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
        'Hours': task.hours
      });
    });
  });

  const csv = Papa.unparse(rows);
  downloadCSV(csv, filename);
}

// Export individual developer schedule to separate files
export function exportIndividualDeveloperSchedules(
  schedules: DeveloperScheduleSummary[],
  sprintDate: string = 'sprint'
) {
  schedules.forEach(devSchedule => {
    const rows: any[] = [];

    // Add summary row
    rows.push({
      'Date': 'SUMMARY',
      'Task ID': '',
      'Task Summary': `Total Work: ${devSchedule.totalWorkHours}h | Idle: ${devSchedule.totalIdleHours}h | Idle %: ${devSchedule.idlePercentage.toFixed(1)}%`,
      'Work Type': '',
      'Hours': '',
      'Daily Total': '',
      'Idle Hours': ''
    });

    rows.push({
      'Date': '',
      'Task ID': '',
      'Task Summary': '',
      'Work Type': '',
      'Hours': '',
      'Daily Total': '',
      'Idle Hours': ''
    });

    devSchedule.dailySchedule.forEach(daySchedule => {
      const dateFormatted = new Date(daySchedule.date).toLocaleDateString('en-US', { 
        weekday: 'short', 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      });

      if (daySchedule.workItems.length > 0) {
        daySchedule.workItems.forEach((workItem, idx) => {
          rows.push({
            'Date': idx === 0 ? dateFormatted : '',
            'Task ID': workItem.taskId,
            'Task Summary': workItem.taskSummary,
            'Work Type': getWorkTypeLabel(workItem.workType),
            'Hours': workItem.hours,
            'Daily Total': idx === 0 ? daySchedule.totalHours : '',
            'Idle Hours': idx === 0 ? daySchedule.idleHours : ''
          });
        });
      } else if (daySchedule.idleHours > 0) {
        rows.push({
          'Date': dateFormatted,
          'Task ID': '',
          'Task Summary': '(No work scheduled)',
          'Work Type': '',
          'Hours': 0,
          'Daily Total': 0,
          'Idle Hours': daySchedule.idleHours
        });
      }
    });

    const csv = Papa.unparse(rows);
    const safeFileName = devSchedule.developerName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    downloadCSV(csv, `${sprintDate}_${safeFileName}_schedule.csv`);
  });
}

// Export developer utilization summary
export function exportDeveloperUtilization(
  schedules: DeveloperScheduleSummary[],
  filename: string = 'developer_utilization.csv'
) {
  const rows = schedules.map(devSchedule => ({
    'Developer': devSchedule.developerName,
    'Total Work Hours': devSchedule.totalWorkHours,
    'Total Idle Hours': devSchedule.totalIdleHours,
    'Idle Percentage': `${devSchedule.idlePercentage.toFixed(1)}%`,
    'Tasks Assigned': devSchedule.taskAssignments.length,
    'Utilization': `${(100 - devSchedule.idlePercentage).toFixed(1)}%`
  }));

  const csv = Papa.unparse(rows);
  downloadCSV(csv, filename);
}

function getWorkTypeLabel(type: string): string {
  switch (type) {
    case 'research': return 'Research';
    case 'development': return 'Development';
    case 'codeReview': return 'Code Review';
    case 'reviewFeedback': return 'Review Feedback';
    case 'defectCorrection': return 'Defect Correction';
    case 'qa': return 'QA Testing';
    case 'context-switch': return 'Context Switch';
    default: return type;
  }
}

function downloadCSV(csv: string, filename: string) {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
