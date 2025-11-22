import { Task, Developer, SprintConfig, WorkBreakdown, DeveloperScheduleSummary, DeveloperDaySchedule } from '../types/index.d';

const CONTEXT_SWITCH_PENALTY = 1; // 1 hour penalty for switching work types

interface WorkItem {
  taskId: string;
  taskSummary: string;
  type: 'research' | 'development' | 'codeReview' | 'reviewFeedback' | 'defectCorrection' | 'qa';
  hours: number;
  priority: number;
  dependencies: string[];
  needsReviewer?: boolean; // For code review work items
}

interface ScheduledWorkItem extends WorkItem {
  assignedTo: string;
  startDate: Date;
  endDate: Date;
  dayAllocations: { date: string; hours: number }[]; // Which days and how many hours
}

export interface ScheduleResult {
  tasks: Task[];
  unscheduledTasks: Task[];
  warnings: string[];
  schedule: ScheduledWorkItem[];
  developerSchedules: DeveloperScheduleSummary[];
}

function priorityToNumber(priority: string): number {
  switch (priority) {
    case 'Critical': return 4;
    case 'High': return 3;
    case 'Medium': return 2;
    case 'Low': return 1;
    default: return 0;
  }
}

function getDeveloperCapacity(dev: Developer, date: Date, sprintConfig: SprintConfig): number {
  const dateStr = date.toISOString().split('T')[0];
  const dayOfWeek = date.getDay();

  if (dev.ptoDates?.includes(dateStr)) return 0;
  if (dev.customCapacity?.[dateStr] !== undefined) return dev.customCapacity[dateStr];
  if (sprintConfig.holidays.includes(dateStr)) return 0;
  if (!sprintConfig.workDays.includes(dayOfWeek)) return 0;

  return dev.dailyCapacity;
}

function createWorkItems(tasks: Task[]): WorkItem[] {
  const workItems: WorkItem[] = [];
  const workOrder: Array<keyof WorkBreakdown> = ['research', 'development', 'codeReview', 'reviewFeedback'];

  tasks.forEach(task => {
    const priority = priorityToNumber(task.priority);

    workOrder.forEach(workType => {
      const hours = task.work[workType];
      if (hours && hours > 0) {
        const workItemDeps = [...(task.dependencies || [])];
        const workTypeIndex = workOrder.indexOf(workType);
        
        if (workTypeIndex > 0) {
          workItemDeps.push(`${task.id}:${workOrder[workTypeIndex - 1]}`);
        }

        workItems.push({
          taskId: task.id,
          taskSummary: task.summary,
          type: workType as any,
          hours,
          priority,
          dependencies: workItemDeps,
          needsReviewer: workType === 'codeReview'
        });
      }
    });

    if (task.work.qa && task.work.qa > 0) {
      workItems.push({
        taskId: task.id,
        taskSummary: task.summary,
        type: 'qa',
        hours: task.work.qa,
        priority,
        dependencies: [...(task.dependencies || []), `${task.id}:reviewFeedback`]
      });
    }

    if (task.work.defectCorrection > 0) {
      workItems.push({
        taskId: task.id,
        taskSummary: task.summary,
        type: 'defectCorrection',
        hours: task.work.defectCorrection,
        priority,
        dependencies: [...(task.dependencies || [])]
      });
    }
  });

  return workItems;
}

function sortWorkItems(workItems: WorkItem[], tasks: Task[]): WorkItem[] {
  const taskCompletionOrder = new Map<string, number>();
  const workItemKey = (item: WorkItem) => `${item.taskId}:${item.type}`;
  let order = 0;
  const visited = new Set<string>();

  function visit(item: WorkItem) {
    const key = workItemKey(item);
    if (visited.has(key)) return;

    item.dependencies.forEach(dep => {
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

  const sortedByPriority = [...workItems].sort((a, b) => b.priority - a.priority);
  sortedByPriority.forEach(visit);

  return workItems.sort((a, b) => {
    const orderA = taskCompletionOrder.get(workItemKey(a)) || 0;
    const orderB = taskCompletionOrder.get(workItemKey(b)) || 0;
    if (orderA !== orderB) return orderA - orderB;
    return b.priority - a.priority;
  });
}

// Check if switching from one work type to another incurs penalty
function needsContextSwitch(prevType: string | null, nextType: string): boolean {
  if (!prevType) return false;
  
  // Group similar work types
  const reviewTypes = ['codeReview', 'reviewFeedback'];
  const bugTypes = ['defectCorrection', 'qa'];
  
  if (reviewTypes.includes(prevType) && reviewTypes.includes(nextType)) return false;
  if (bugTypes.includes(prevType) && bugTypes.includes(nextType)) return false;
  if (prevType === nextType) return false;
  
  return true;
}

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
    return { tasks, unscheduledTasks: tasks, warnings, schedule, developerSchedules: [] };
  }

  const workItems = createWorkItems(tasks);
  const sortedWorkItems = sortWorkItems(workItems, tasks);

  // Track developer availability and last work type
  const devAvailability = new Map<string, Map<string, number>>();
  const devLastWorkType = new Map<string, Map<string, string | null>>(); // dev -> date -> lastWorkType
  const devDaySchedule = new Map<string, Map<string, { type: string; hours: number; taskId: string; taskSummary: string }[]>>();
  
  const completionTimes = new Map<string, Date>();
  const startDate = new Date(sprintConfig.startDate + 'T00:00:00');
  const endDate = new Date(sprintConfig.endDate + 'T23:59:59');

  // Initialize tracking
  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
    const dateStr = d.toISOString().split('T')[0];
    const dayAvailability = new Map<string, number>();
    const dayLastWorkType = new Map<string, string | null>();
    
    developers.forEach(dev => {
      dayAvailability.set(dev.id, getDeveloperCapacity(dev, new Date(d), sprintConfig));
      dayLastWorkType.set(dev.id, null);
      
      if (!devDaySchedule.has(dev.id)) {
        devDaySchedule.set(dev.id, new Map());
      }
      devDaySchedule.get(dev.id)!.set(dateStr, []);
    });
    
    devAvailability.set(dateStr, dayAvailability);
    devLastWorkType.set(dateStr, dayLastWorkType);
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

    // Filter developers based on work type
    let eligibleDevs = developers;
    if (workItem.needsReviewer) {
      eligibleDevs = developers.filter(d => d.canReview);
      if (eligibleDevs.length === 0) {
        warnings.push(`No reviewers available for ${workItem.taskId} code review`);
        continue;
      }
    }

    // Try to assign to a developer
    let remainingHours = workItem.hours;
    let currentDate = new Date(earliestStart);
    let assigned = false;
    let assignedDev: string | null = null;
    const workStartDate = new Date(currentDate);
    const dayAllocations: { date: string; hours: number }[] = [];

    while (remainingHours > 0 && currentDate <= endDate) {
      const dateStr = currentDate.toISOString().split('T')[0];
      const dayAvailability = devAvailability.get(dateStr);
      const dayLastWork = devLastWorkType.get(dateStr);

      if (!dayAvailability) {
        currentDate.setDate(currentDate.getDate() + 1);
        continue;
      }

      // Find best developer: prioritize same person, check for context switching
      let bestDev: string | null = null;
      let maxCapacity = 0;

      eligibleDevs.forEach(dev => {
        let capacity = dayAvailability.get(dev.id) || 0;
        if (capacity <= 0) return;

        // Apply context switch penalty if needed
        const lastWorkType = dayLastWork?.get(dev.id) || null;
        if (needsContextSwitch(lastWorkType, workItem.type)) {
          capacity = Math.max(0, capacity - CONTEXT_SWITCH_PENALTY);
        }

        // Prefer continuing with same developer
        if (assignedDev === dev.id) {
          capacity += 0.5; // Small boost for continuity
        }

        if (capacity > maxCapacity) {
          maxCapacity = capacity;
          bestDev = dev.id;
        }
      });

      if (bestDev && maxCapacity > 0) {
        assignedDev = bestDev;
        
        // Apply context switch penalty
        const lastWorkType = dayLastWork?.get(bestDev) || null;
        let actualCapacity = dayAvailability.get(bestDev) || 0;
        
        if (needsContextSwitch(lastWorkType, workItem.type)) {
          actualCapacity = Math.max(0, actualCapacity - CONTEXT_SWITCH_PENALTY);
          dayAvailability.set(bestDev, actualCapacity);
          
          if (actualCapacity > 0) {
            // Record context switch time
            devDaySchedule.get(bestDev)?.get(dateStr)?.push({
              type: 'context-switch',
              hours: CONTEXT_SWITCH_PENALTY,
              taskId: workItem.taskId,
              taskSummary: 'Context switching'
            });
          }
        }

        const hoursToAllocate = Math.min(remainingHours, actualCapacity);
        if (hoursToAllocate > 0) {
          remainingHours -= hoursToAllocate;
          dayAvailability.set(bestDev, actualCapacity - hoursToAllocate);
          dayLastWork?.set(bestDev, workItem.type);
          assigned = true;

          dayAllocations.push({ date: dateStr, hours: hoursToAllocate });

          // Record in day schedule
          devDaySchedule.get(bestDev)?.get(dateStr)?.push({
            type: workItem.type,
            hours: hoursToAllocate,
            taskId: workItem.taskId,
            taskSummary: workItem.taskSummary
          });
        }
      }

      currentDate.setDate(currentDate.getDate() + 1);
    }

    if (assigned && assignedDev) {
      const scheduledItem: ScheduledWorkItem = {
        ...workItem,
        assignedTo: assignedDev,
        startDate: workStartDate,
        endDate: new Date(currentDate),
        dayAllocations
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

    const nonDefectItems = taskWorkItems.filter(s => s.type !== 'defectCorrection');
    const startDate = nonDefectItems.reduce((min, item) =>
      item.startDate < min ? item.startDate : min, nonDefectItems[0].startDate);
    const endDate = nonDefectItems.reduce((max, item) =>
      item.endDate > max ? item.endDate : max, nonDefectItems[0].endDate);

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

  // Generate developer schedules
  const developerSchedules = generateDeveloperSchedules(developers, schedule, sprintConfig, devDaySchedule);

  return {
    tasks: scheduledTasks,
    unscheduledTasks: unscheduled,
    warnings,
    schedule,
    developerSchedules
  };
}

function generateDeveloperSchedules(
  developers: Developer[],
  schedule: ScheduledWorkItem[],
  sprintConfig: SprintConfig,
  devDaySchedule: Map<string, Map<string, { type: string; hours: number; taskId: string; taskSummary: string }[]>>
): DeveloperScheduleSummary[] {
  const startDate = new Date(sprintConfig.startDate + 'T00:00:00');
  const endDate = new Date(sprintConfig.endDate + 'T23:59:59');

  return developers.map(dev => {
    const devWorkItems = schedule.filter(s => s.assignedTo === dev.id);
    let totalWorkHours = 0;
    let totalIdleHours = 0;

    const dailySchedule: DeveloperDaySchedule[] = [];

    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      const capacity = getDeveloperCapacity(dev, new Date(d), sprintConfig);
      const dayWork = devDaySchedule.get(dev.id)?.get(dateStr) || [];

      const workHours = dayWork.reduce((sum, w) => sum + w.hours, 0);
      const idleHours = Math.max(0, capacity - workHours);

      totalWorkHours += workHours;
      totalIdleHours += idleHours;

      dailySchedule.push({
        date: dateStr,
        developerId: dev.id,
        workItems: dayWork.map(w => ({
          taskId: w.taskId,
          taskSummary: w.taskSummary,
          workType: w.type,
          hours: w.hours
        })),
        totalHours: workHours,
        idleHours
      });
    }

    const taskAssignments = devWorkItems.map(item => ({
      taskId: item.taskId,
      summary: item.taskSummary,
      workType: item.type,
      startDate: item.startDate.toISOString().split('T')[0],
      endDate: item.endDate.toISOString().split('T')[0],
      hours: item.hours
    }));

    const totalCapacity = totalWorkHours + totalIdleHours;
    const idlePercentage = totalCapacity > 0 ? (totalIdleHours / totalCapacity) * 100 : 0;

    return {
      developerId: dev.id,
      developerName: dev.name,
      totalWorkHours,
      totalIdleHours,
      idlePercentage,
      dailySchedule,
      taskAssignments
    };
  });
}
