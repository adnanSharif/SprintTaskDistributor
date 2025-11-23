import Papa from 'papaparse';
import { Task, Developer, WorkBreakdown } from '../types/index.d';

export type CsvSerializableValue = string | number | boolean | null | undefined;
export type CsvSerializableRow = Record<string, CsvSerializableValue>;
type CsvRow = Record<string, string | undefined>;

export function parseCSV(text: string): CsvRow[] {
  const result = Papa.parse<CsvRow>(text, { header: true, skipEmptyLines: true });
  return result.data;
}

function normalizePriority(value?: string): Task['priority'] {
  if (!value) return 'Medium';
  const normalized = value.trim().toLowerCase();
  switch (normalized) {
    case 'critical':
      return 'Critical';
    case 'high':
      return 'High';
    case 'low':
      return 'Low';
    default:
      return 'Medium';
  }
}

function toNumber(value?: string): number {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function parseTasksCSV(text: string): Task[] {
  const rows = parseCSV(text);
  return rows.map((row, idx) => {
    const work: WorkBreakdown = {
      research: toNumber(row['Research Hours'] || row['research']),
      development: toNumber(row['Development Hours'] || row['development']),
      codeReview: toNumber(row['Code Review Hours'] || row['codeReview']),
      reviewFeedback: toNumber(row['Review Feedback Hours'] || row['reviewFeedback']),
      defectCorrection: toNumber(row['Defect Correction Hours'] || row['defectCorrection']),
      qa: toNumber(row['QA Hours'] || row['qa'])
    };

    const dependenciesValue = row['Dependencies'] || row['dependencies'] || '';
    const depArray = typeof dependenciesValue === 'string'
      ? dependenciesValue.split(';').map(d => d.trim()).filter(Boolean)
      : [];

    return {
      id: row['Issue key'] || row['id'] || row['ID'] || `TASK-${Date.now()}-${idx}`,
      summary: row['Summary'] || row['summary'] || 'Untitled Task',
      priority: normalizePriority(row['Priority'] || row['priority']),
      work,
      dependencies: depArray,
      status: 'Not Started'
    };
  });
}

export function parseTeamCSV(text: string): Developer[] {
  const rows = parseCSV(text);
  return rows.map((row, idx) => {
    const capacityRaw = row['Daily Capacity (hours)'] || row['dailyCapacity'] || row['Capacity'] || '8';
    const parsedCapacity = Number(capacityRaw);
    const dailyCapacity = Number.isFinite(parsedCapacity) ? parsedCapacity : 8;
    const canReviewValue = row['Can Review'] || row['canReview'];
    const canReview = typeof canReviewValue === 'string'
      ? ['true', '1', 'yes', 'y'].includes(canReviewValue.toLowerCase())
      : true;

    return {
      id: row['ID'] || row['id'] || `dev-${Date.now()}-${idx}`,
      name: row['Name'] || row['name'] || row['Display Name'] || 'Unnamed',
      role: 'Dev' as const,
      dailyCapacity,
      canReview
    };
  });
}

export function exportToCSV(rows: CsvSerializableRow[], filename = 'plan.csv') {
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
  const rows: CsvSerializableRow[] = tasks.map(task => ({
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
