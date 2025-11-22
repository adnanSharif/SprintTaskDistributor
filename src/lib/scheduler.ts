import { Task, Developer, SprintConfig, WorkBreakdown } from '../types/index.d';

interface WorkItem {
  taskId: string;
  type: 'research' | 'development' | 'codeReview' | 'reviewFeedback' | 'defectCorrection' | 'qa';
  hours: number;
  priority: number;
  dependencies: string[]; // Task IDs that must complete first
}

interface ScheduledWorkItem extends WorkItem {
  assignedTo: string;
  startDate: Date;
  endDate: Date;
}

export interface ScheduleResult {
  tasks: Task[];
  unscheduledTasks: Task[];
  warnings: string[];
  schedule: ScheduledWorkItem[];
}

// Convert priority to numeric value for sorting
function priorityToNumber(priority: string): number {
  switch (priority) {
    case 'Critical': return 4;
    case 'High': return 3;
    case 'Medium': return 2;
    case 'Low': return 1;
    default: return 0;
  }
}

// Get all working hours for a developer on a specific date
function getDeveloperCapacity(
  dev: Developer,
  date: Date,
  sprintConfig: SprintConfig
): number {
  const dateStr = date.toISOString().split('T')[0];
  const dayOfWeek = date.getDay();

  // Check PTO
  if (dev.ptoDates?.includes(dateStr)) return 0;

  // Check custom capacity
  if (dev.customCapacity?.[dateStr] !== undefined) {
    return dev.customCapacity[dateStr];
  }

  // Check company holidays
  if (sprintConfig.holidays.includes(dateStr)) return 0;

  // Check if it's a work day
  if (!sprintConfig.workDays.includes(dayOfWeek)) return 0;

  return dev.dailyCapacity;
}

// Break down tasks into individual work items
function createWorkItems(tasks: Task[]): WorkItem[] {
  const workItems: WorkItem[] = [];
  const workOrder: Array<keyof WorkBreakdown> = [
    'research',
    'development',
    'codeReview',
    'reviewFeedback'
  ];

  tasks.forEach(task => {
    const priority = priorityToNumber(task.priority);
    
    workOrder.forEach(workType => {
      const hours = task.work[workType];
      if (hours && hours > 0) {
        // Each work item depends on previous work in the same task + task dependencies
        const workItemDeps = [...(task.dependencies || [])];
        
        // Add internal dependencies (research -> dev -> review -> feedback)
        const workTypeIndex = workOrder.indexOf(workType);
        if (workTypeIndex > 0) {
          // This work type depends on previous work type of the same task
          workItemDeps.push(`${task.id}:${workOrder[workTypeIndex - 1]}`);
        }

        workItems.push({
          taskId: task.id,
          type: workType as any,
          hours,
          priority,
          dependencies: workItemDeps
        });
      }
    });

    // QA and defect correction are separate (QA happens after feedback)
    if (task.work.qa && task.work.qa > 0) {
      workItems.push({
        taskId: task.id,
        type: 'qa',
        hours: task.work.qa,
        priority,
        dependencies: [...(task.dependencies || []), `${task.id}:reviewFeedback`]
      });
    }

    // Defect correction is ongoing and scheduled separately
    if (task.work.defectCorrection > 0) {
      workItems.push({
        taskId: task.id,
        type: 'defectCorrection',
        hours: task.work.defectCorrection,
        priority,
        dependencies: [...(task.dependencies || [])]
      });
    }
  });

  return workItems;
}

// Topological sort considering dependencies
function sortWorkItems(workItems: WorkItem[], tasks: Task[]): WorkItem[] {
  const taskCompletionOrder = new Map<string, number>();
  const workItemKey = (item: WorkItem) => `${item.taskId}:${item.type}`;
  
  // Build completion order
  let order = 0;
  const visited = new Set<string>();
  
  function visit(item: WorkItem) {
    const key = workItemKey(item);
    if (visited.has(key)) return;
    
    // Visit dependencies first
    item.dependencies.forEach(dep => {
      // dep can be a task ID or taskId:workType
      const depItems = workItems.filter(wi => {
        if (dep.includes(':')) {
          return workItemKey(wi) === dep;
        } else {
          return wi.taskId === dep;
        }
      });
      depItems.forEach(visit);
    });
    
    visited.add(key);
    taskCompletionOrder.set(key, order++);
  }
  
  // Sort by priority first, then visit in order
  const sortedByPriority = [...workItems].sort((a, b) => b.priority - a.priority);
  sortedByPriority.forEach(visit);
  
  // Sort by completion order
  return workItems.sort((a, b) => {
    const orderA = taskCompletionOrder.get(workItemKey(a)) || 0;
    const orderB = taskCompletionOrder.get(workItemKey(b)) || 0;
    if (orderA !== orderB) return orderA - orderB;
    return b.priority - a.priority; // Tie-break with priority
  });
}

// Schedule work items to developers
export function scheduleTasksWithDependencies(
  tasks: Task[],
  developers: Developer[],
  sprintConfig: SprintConfig
): ScheduleResult {
  const warnings: string[] = [];
  const schedule: ScheduledWorkItem[] = [];
  const unscheduledTasks: Task[] = [];
  
  if (developers.length === 0) {
    warnings.push('No developers available');
    return { tasks, unscheduledTasks: tasks, warnings, schedule };
  }

  // Create work items
  const workItems = createWorkItems(tasks);
  
  // Sort by dependencies and priority
  const sortedWorkItems = sortWorkItems(workItems, tasks);
  
  // Track developer availability (date -> developer -> available hours)
  const devAvailability = new Map<string, Map<string, number>>();
  
  // Track when each work item completes
  const completionTimes = new Map<string, Date>();
  
  const startDate = new Date(sprintConfig.startDate + 'T00:00:00');
  const endDate = new Date(sprintConfig.endDate + 'T23:59:59');
  
  // Initialize availability
  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
    const dateStr = d.toISOString().split('T')[0];
    const dayAvailability = new Map<string, number>();
    developers.forEach(dev => {
      dayAvailability.set(dev.id, getDeveloperCapacity(dev, new Date(d), sprintConfig));
    });
    devAvailability.set(dateStr, dayAvailability);
  }
  
  // Schedule each work item
  for (const workItem of sortedWorkItems) {
    const workItemKey = `${workItem.taskId}:${workItem.type}`;
    
    // Find earliest start date based on dependencies
    let earliestStart = new Date(startDate);
    
    for (const dep of workItem.dependencies) {
      const depCompletionTime = completionTimes.get(dep) || 
        (dep.includes(':') ? completionTimes.get(dep) : null);
      
      if (!depCompletionTime) {
        // Check if it's a task-level dependency (all work of that task)
        const taskWorkItems = sortedWorkItems.filter(wi => wi.taskId === dep);
        const maxCompletion = taskWorkItems.reduce((max, wi) => {
          const time = completionTimes.get(`${wi.taskId}:${wi.type}`);
          return time && time > max ? time : max;
        }, earliestStart);
        
        if (maxCompletion > earliestStart) {
          earliestStart = maxCompletion;
        }
      } else if (depCompletionTime > earliestStart) {
        earliestStart = depCompletionTime;
      }
    }
    
    // Try to assign to a developer
    let remainingHours = workItem.hours;
    let currentDate = new Date(earliestStart);
    let assigned = false;
    let assignedDev: string | null = null;
    const workStartDate = new Date(currentDate);
    
    // Find best developer with capacity
    while (remainingHours > 0 && currentDate <= endDate) {
      const dateStr = currentDate.toISOString().split('T')[0];
      const dayAvailability = devAvailability.get(dateStr);
      
      if (!dayAvailability) {
        currentDate.setDate(currentDate.getDate() + 1);
        continue;
      }
      
      // Find developer with most available capacity
      let bestDev: string | null = null;
      let maxCapacity = 0;
      
      dayAvailability.forEach((capacity, devId) => {
        if (capacity > maxCapacity) {
          maxCapacity = capacity;
          bestDev = devId;
        }
      });
      
      if (bestDev && maxCapacity > 0) {
        assignedDev = bestDev;
        const hoursToAllocate = Math.min(remainingHours, maxCapacity);
        remainingHours -= hoursToAllocate;
        dayAvailability.set(bestDev, maxCapacity - hoursToAllocate);
        assigned = true;
      }
      
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    if (assigned && assignedDev) {
      const scheduledItem: ScheduledWorkItem = {
        ...workItem,
        assignedTo: assignedDev,
        startDate: workStartDate,
        endDate: new Date(currentDate)
      };
      schedule.push(scheduledItem);
      completionTimes.set(workItemKey, new Date(currentDate));
    } else {
      warnings.push(`Could not schedule ${workItem.taskId} - ${workItem.type} (${workItem.hours}h)`);
    }
  }
  
  // Update tasks with schedule info
  const scheduledTasks = tasks.map(task => {
    const taskWorkItems = schedule.filter(s => s.taskId === task.id);
    
    if (taskWorkItems.length === 0) {
      return task;
    }
    
    // Find earliest start and latest end (excluding defect correction)
    const nonDefectItems = taskWorkItems.filter(s => s.type !== 'defectCorrection');
    const startDate = nonDefectItems.reduce((min, item) => 
      item.startDate < min ? item.startDate : min, nonDefectItems[0].startDate);
    const endDate = nonDefectItems.reduce((max, item) => 
      item.endDate > max ? item.endDate : max, nonDefectItems[0].endDate);
    
    // Most common assignee
    const assigneeCounts = new Map<string, number>();
    taskWorkItems.forEach(item => {
      assigneeCounts.set(item.assignedTo, (assigneeCounts.get(item.assignedTo) || 0) + 1);
    });
    const assignedTo = Array.from(assigneeCounts.entries()).sort((a, b) => b[1] - a[1])[0][0];
    
    return {
      ...task,
      assignedTo,
      scheduledStart: startDate.toISOString(),
      scheduledEnd: endDate.toISOString(),
      status: 'Not Started' as const
    };
  });
  
  // Identify unscheduled tasks
  const scheduledTaskIds = new Set(schedule.map(s => s.taskId));
  const unscheduled = tasks.filter(t => !scheduledTaskIds.has(t.id));
  
  return {
    tasks: scheduledTasks,
    unscheduledTasks: unscheduled,
    warnings,
    schedule
  };
}
