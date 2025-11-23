import { scheduleTasksWithDependencies } from '../src/lib/schedulerEnhanced';
import { Developer, SprintConfig, Task } from '../src/types/index.d';

describe('schedulerEnhanced', () => {
  const sprintConfig: SprintConfig = {
    startDate: '2025-01-06',
    endDate: '2025-01-10',
    workDays: [1, 2, 3, 4, 5],
    holidays: []
  };

  const baseDevelopers: Developer[] = [
    {
      id: 'dev1',
      name: 'Dev One',
      role: 'Dev',
      dailyCapacity: 8,
      canReview: false,
      ptoDates: [],
      customCapacity: {}
    },
    {
      id: 'dev2',
      name: 'Dev Two',
      role: 'Dev',
      dailyCapacity: 8,
      canReview: true,
      ptoDates: [],
      customCapacity: {}
    }
  ];

  it('assigns code reviews only to developers flagged as reviewers', () => {
    const tasks: Task[] = [
      {
        id: 'TASK-1',
        summary: 'Feature work',
        priority: 'High',
        work: {
          research: 0,
          development: 0,
          codeReview: 4,
          reviewFeedback: 0,
          defectCorrection: 0,
          qa: 0
        },
        dependencies: []
      }
    ];

    const result = scheduleTasksWithDependencies(tasks, baseDevelopers, sprintConfig);

    const reviewerSchedule = result.developerSchedules.find(dev => dev.developerId === 'dev2');
    const reviewerWorkTypes = reviewerSchedule?.dailySchedule.flatMap(day => day.workItems.map(item => item.workType)) || [];

    expect(reviewerWorkTypes).toContain('codeReview');

    const nonReviewerSchedule = result.developerSchedules.find(dev => dev.developerId === 'dev1');
    const nonReviewerWorkTypes = nonReviewerSchedule?.dailySchedule.flatMap(day => day.workItems.map(item => item.workType)) || [];
    expect(nonReviewerWorkTypes).not.toContain('codeReview');
    expect(result.warnings).toHaveLength(0);
  });

  it('records context switch penalties when switching work types', () => {
    const singleDev: Developer[] = [baseDevelopers[1]]; // Reviewer dev
    const tasks: Task[] = [
      {
        id: 'TASK-CTX-1',
        summary: 'Research task',
        priority: 'High',
        work: {
          research: 2,
          development: 0,
          codeReview: 0,
          reviewFeedback: 0,
          defectCorrection: 0,
          qa: 0
        },
        dependencies: []
      },
      {
        id: 'TASK-CTX-2',
        summary: 'Review task',
        priority: 'High',
        work: {
          research: 0,
          development: 0,
          codeReview: 2,
          reviewFeedback: 0,
          defectCorrection: 0,
          qa: 0
        },
        dependencies: []
      }
    ];

    const result = scheduleTasksWithDependencies(tasks, singleDev, sprintConfig);
    const devSchedule = result.developerSchedules[0];
    const workItems = devSchedule.dailySchedule.flatMap(day => day.workItems.map(item => item.workType));

    expect(workItems).toContain('context-switch');
  });

  it('emits warnings when no reviewers are available', () => {
    const nonReviewerOnly: Developer[] = [baseDevelopers[0]];
    const tasksNeedingReview: Task[] = [
      {
        id: 'TASK-NO-REVIEWER',
        summary: 'Needs review',
        priority: 'High',
        work: {
          research: 0,
          development: 0,
          codeReview: 3,
          reviewFeedback: 0,
          defectCorrection: 0,
          qa: 0
        },
        dependencies: []
      }
    ];

    const result = scheduleTasksWithDependencies(tasksNeedingReview, nonReviewerOnly, sprintConfig);

    expect(result.warnings.some(w => w.includes('No reviewers available'))).toBe(true);
  });
});
