declare module 'papaparse';

// Core Types
export interface Developer {
  id: string;
  name: string;
  role: 'Dev'; // Only Dev role for now
  dailyCapacity: number; // Default capacity in hours
  canReview: boolean; // Whether developer can perform code reviews
  ptoDates?: string[]; // ISO date strings for PTO
  customCapacity?: Record<string, number>; // Date -> hours override
}

export interface WorkBreakdown {
  research: number;      // Hours for research
  development: number;   // Hours for development
  codeReview: number;    // Hours for code review
  reviewFeedback: number; // Hours for addressing review feedback
  defectCorrection: number; // Hours for fixing defects (ongoing)
  qa?: number;           // Optional QA testing hours
}

export interface Task {
  id: string;
  summary: string;
  priority: 'Critical' | 'High' | 'Medium' | 'Low';
  work: WorkBreakdown;
  dependencies?: string[]; // Task IDs that must complete before this
  assignedTo?: string; // Developer ID
  scheduledStart?: string; // ISO datetime
  scheduledEnd?: string; // ISO datetime (when dev work completes, excludes defects)
  status?: 'Not Started' | 'In Progress' | 'Completed';
}

export interface SprintConfig {
  startDate: string; // ISO date
  endDate: string; // ISO date
  workDays: number[]; // 0-6, where 0=Sunday, 1=Monday, etc. Default [1,2,3,4,5]
  holidays: string[]; // ISO date strings for company holidays
}

export interface DayCapacity {
  date: string; // ISO date
  developerId: string;
  hours: number;
}

export interface AssignmentResult {
  tasks: Task[];
  unscheduledTasks: Task[]; // Tasks that won't fit in sprint
  warnings: string[];
}

export interface DeveloperDaySchedule {
  date: string; // ISO date
  developerId: string;
  workItems: {
    taskId: string;
    taskSummary: string;
    workType: string;
    hours: number;
    startTime?: string; // Time of day if needed
  }[];
  totalHours: number;
  idleHours: number;
}

export interface DeveloperScheduleSummary {
  developerId: string;
  developerName: string;
  totalWorkHours: number;
  totalIdleHours: number;
  idlePercentage: number;
  dailySchedule: DeveloperDaySchedule[];
  taskAssignments: {
    taskId: string;
    summary: string;
    workType: string;
    startDate: string;
    endDate: string;
    hours: number;
  }[];
}

