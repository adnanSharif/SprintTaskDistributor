import Papa from 'papaparse';
import { Task, Developer, WorkBreakdown } from '../types/index.d';

export function parseCSV(text: string) {
  return Papa.parse(text, { header: true, skipEmptyLines: true }).data as any[];
}

export function parseTasksCSV(text: string): Task[] {
  const rows = parseCSV(text);
  return rows.map((row: any, idx: number) => {
    const work: WorkBreakdown = {
      research: Number(row['Research Hours'] || row['research'] || 0),
      development: Number(row['Development Hours'] || row['development'] || 0),
      codeReview: Number(row['Code Review Hours'] || row['codeReview'] || 0),
      reviewFeedback: Number(row['Review Feedback Hours'] || row['reviewFeedback'] || 0),
      defectCorrection: Number(row['Defect Correction Hours'] || row['defectCorrection'] || 0),
      qa: Number(row['QA Hours'] || row['qa'] || 0)
    };

    const dependencies = row['Dependencies'] || row['dependencies'] || '';
    const depArray = dependencies
      ? dependencies.split(';').map((d: string) => d.trim()).filter(Boolean)
      : [];

    return {
      id: row['Issue key'] || row['id'] || row['ID'] || `TASK-${Date.now()}-${idx}`,
      summary: row['Summary'] || row['summary'] || 'Untitled Task',
      priority: (row['Priority'] || row['priority'] || 'Medium') as any,
      work,
      dependencies: depArray,
      status: 'Not Started'
    };
  });
}

export function parseTeamCSV(text: string): Developer[] {
  const rows = parseCSV(text);
  return rows.map((row: any, idx: number) => ({
    id: row['ID'] || row['id'] || `dev-${Date.now()}-${idx}`,
    name: row['Name'] || row['name'] || row['Display Name'] || 'Unnamed',
    role: 'Dev' as const,
    dailyCapacity: Number(row['Daily Capacity (hours)'] || row['dailyCapacity'] || row['Capacity'] || 8),
    canReview: row['Can Review'] ? row['Can Review'].toLowerCase() === 'true' || row['Can Review'] === '1' : true
  }));
}

export function exportToCSV(rows: any[], filename = 'plan.csv') {
  // Use PapaParse to generate CSV (safer than xlsx for simple CSV export)
  const csv = Papa.unparse(rows);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportTasksToCSV(tasks: Task[], filename = 'sprint_plan.csv') {
  const rows = tasks.map(task => ({
    'Task ID': task.id,
    'Summary': task.summary,
    'Priority': task.priority,
    'Assigned To': task.assignedTo || '',
    'Status': task.status || 'Not Started',
    'Research Hours': task.work.research,
    'Development Hours': task.work.development,
    'Code Review Hours': task.work.codeReview,
    'Review Feedback Hours': task.work.reviewFeedback,
    'Defect Correction Hours': task.work.defectCorrection,
    'QA Hours': task.work.qa || 0,
    'Dependencies': task.dependencies?.join(';') || '',
    'Scheduled Start': task.scheduledStart || '',
    'Scheduled End': task.scheduledEnd || ''
  }));
  exportToCSV(rows, filename);
}
