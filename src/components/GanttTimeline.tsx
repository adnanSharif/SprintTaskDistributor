'use client';

import React, { useMemo } from 'react';
import type { Developer } from '../types/index.d';
import type { ScheduleResult } from '../lib/schedulerEnhanced';

interface Props {
  scheduleResult: ScheduleResult;
  developers: Developer[];
  sprintStart: string;
  sprintEnd: string;
}

export default function GanttTimeline({ scheduleResult, developers, sprintStart, sprintEnd }: Props) {
  const { tasks, schedule, unscheduledTasks, warnings } = scheduleResult;

  const getDatesInRange = useMemo(() => {
    const dates: Date[] = [];
    const start = new Date(sprintStart + 'T00:00:00');
    const end = new Date(sprintEnd + 'T00:00:00');
    
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      dates.push(new Date(d));
    }
    return dates;
  }, [sprintStart, sprintEnd]);

  const getTaskColor = (priority: string) => {
    switch (priority) {
      case 'Critical': return '#dc2626';
      case 'High': return '#f59e0b';
      case 'Medium': return '#3b82f6';
      case 'Low': return '#6b7280';
      default: return '#6b7280';
    }
  };

  const getWorkTypeColor = (type: string) => {
    switch (type) {
      case 'research': return '#8b5cf6';
      case 'development': return '#3b82f6';
      case 'codeReview': return '#ec4899';
      case 'reviewFeedback': return '#f59e0b';
      case 'defectCorrection': return '#ef4444';
      case 'qa': return '#10b981';
      default: return '#6b7280';
    }
  };

  const getWorkTypeLabel = (type: string) => {
    switch (type) {
      case 'research': return '🔍 Research';
      case 'development': return '💻 Dev';
      case 'codeReview': return '👀 Review';
      case 'reviewFeedback': return '🔄 Feedback';
      case 'defectCorrection': return '🐛 Defects';
      case 'qa': return '✅ QA';
      default: return type;
    }
  };

  const calculateBarPosition = (startDate: Date, endDate: Date) => {
    const sprintStartDate = new Date(sprintStart + 'T00:00:00');
    const sprintEndDate = new Date(sprintEnd + 'T00:00:00');
    const totalDays = Math.ceil((sprintEndDate.getTime() - sprintStartDate.getTime()) / (1000 * 60 * 60 * 24));
    
    const startOffset = Math.max(0, Math.ceil((startDate.getTime() - sprintStartDate.getTime()) / (1000 * 60 * 60 * 24)));
    const duration = Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
    
    const left = (startOffset / totalDays) * 100;
    const width = (duration / totalDays) * 100;
    
    return { left: `${left}%`, width: `${width}%` };
  };

  if (tasks.length === 0) {
    return (
      <div style={{ padding: 24 }}>
        <h3 style={{ color: 'var(--primary)', fontWeight: 600, marginBottom: 16 }}>
          <span style={{ marginRight: 6 }}>📊</span>Sprint Timeline
        </h3>
        <div style={{ fontSize: 13, color: 'var(--muted)', background: '#f9fafb', padding: 32, borderRadius: 6, textAlign: 'center' }}>
          No tasks scheduled yet
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: 24 }}>
      <h3 style={{ color: 'var(--primary)', fontWeight: 600, marginBottom: 16 }}>
        <span style={{ marginRight: 6 }}>📊</span>Sprint Timeline (Gantt View)
      </h3>

      {/* Warnings */}
      {warnings.length > 0 && (
        <div style={{ background: '#fef3c7', border: '1px solid #fde047', borderRadius: 8, padding: 16, marginBottom: 16 }}>
          <div style={{ fontWeight: 600, marginBottom: 8, color: '#854d0e' }}>⚠️ Scheduling Warnings</div>
          <ul style={{ margin: 0, paddingLeft: 20, fontSize: 13, color: '#854d0e' }}>
            {warnings.slice(0, 5).map((warning, idx) => (
              <li key={idx}>{warning}</li>
            ))}
            {warnings.length > 5 && <li>...and {warnings.length - 5} more</li>}
          </ul>
        </div>
      )}

      {/* Unscheduled Tasks */}
      {unscheduledTasks.length > 0 && (
        <div style={{ background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: 8, padding: 16, marginBottom: 16 }}>
          <div style={{ fontWeight: 600, marginBottom: 8, color: '#991b1b' }}>
            ❌ Tasks Not Scheduled ({unscheduledTasks.length})
          </div>
          <div style={{ fontSize: 13, color: '#991b1b' }}>
            These tasks won&rsquo;t be completed within the sprint:
            {unscheduledTasks.slice(0, 3).map(task => (
              <div key={task.id} style={{ marginTop: 4 }}>• {task.id}: {task.summary}</div>
            ))}
            {unscheduledTasks.length > 3 && (
              <div style={{ marginTop: 4 }}>• ...and {unscheduledTasks.length - 3} more</div>
            )}
          </div>
        </div>
      )}

      {/* Gantt Chart */}
      <div style={{ border: '1px solid var(--border)', borderRadius: 8, background: '#fff', overflowX: 'auto' }}>
        {/* Header with dates */}
        <div style={{ display: 'grid', gridTemplateColumns: '250px 1fr', borderBottom: '2px solid var(--border)', background: '#f9fafb' }}>
          <div style={{ padding: 12, fontWeight: 600, fontSize: 13, borderRight: '2px solid var(--border)' }}>
            Task / Work Item
          </div>
          <div style={{ position: 'relative', minWidth: 800 }}>
            <div style={{ display: 'flex', height: 40, alignItems: 'center' }}>
              {getDatesInRange.map((date, idx) => (
                <div
                  key={idx}
                  style={{
                    flex: 1,
                    textAlign: 'center',
                    fontSize: 11,
                    padding: 4,
                    borderLeft: idx === 0 ? 'none' : '1px solid #e5e7eb',
                    color: date.getDay() === 0 || date.getDay() === 6 ? 'var(--muted)' : 'inherit'
                  }}
                >
                  <div>{date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
                  <div style={{ fontSize: 10, color: 'var(--muted)' }}>
                    {date.toLocaleDateString('en-US', { weekday: 'short' })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Task rows */}
        <div style={{ maxHeight: 600, overflowY: 'auto' }}>
          {tasks.filter(t => t.scheduledStart).map(task => {
            const taskScheduleItems = schedule.filter(s => s.taskId === task.id);
            const developer = developers.find(d => d.id === task.assignedTo);
            
            return (
              <div key={task.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                {/* Task header row */}
                <div style={{ display: 'grid', gridTemplateColumns: '250px 1fr' }}>
                  <div style={{ padding: 12, borderRight: '2px solid var(--border)', background: '#fafafa' }}>
                    <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 4 }}>
                      {task.id}
                    </div>
                    <div style={{ fontSize: 13, marginBottom: 4 }}>{task.summary}</div>
                    <div style={{ fontSize: 11, color: 'var(--muted)' }}>
                      👤 {developer?.name || 'Unassigned'}
                    </div>
                  </div>
                  <div style={{ position: 'relative', minWidth: 800, minHeight: 40, background: '#fafafa' }}>
                    {/* Task overall bar */}
                    {task.scheduledStart && task.scheduledEnd && (
                      <div
                        style={{
                          position: 'absolute',
                          top: 8,
                          height: 24,
                          background: getTaskColor(task.priority),
                          opacity: 0.2,
                          borderRadius: 4,
                          ...calculateBarPosition(
                            new Date(task.scheduledStart),
                            new Date(task.scheduledEnd)
                          )
                        }}
                      />
                    )}
                  </div>
                </div>

                {/* Work item rows */}
                {taskScheduleItems.map((workItem, idx) => (
                  <div key={idx} style={{ display: 'grid', gridTemplateColumns: '250px 1fr' }}>
                    <div style={{ padding: '8px 12px 8px 32px', borderRight: '2px solid var(--border)', fontSize: 12, color: 'var(--muted)' }}>
                      {getWorkTypeLabel(workItem.type)} ({workItem.hours}h)
                    </div>
                    <div style={{ position: 'relative', minWidth: 800, minHeight: 32 }}>
                      <div
                        style={{
                          position: 'absolute',
                          top: 6,
                          height: 20,
                          background: getWorkTypeColor(workItem.type),
                          borderRadius: 4,
                          display: 'flex',
                          alignItems: 'center',
                          paddingLeft: 8,
                          fontSize: 11,
                          color: '#fff',
                          fontWeight: 500,
                          ...calculateBarPosition(workItem.startDate, workItem.endDate)
                        }}
                        title={`${getWorkTypeLabel(workItem.type)}: ${workItem.startDate.toLocaleDateString()} - ${workItem.endDate.toLocaleDateString()}`}
                      >
                        {workItem.hours}h
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div style={{ marginTop: 16, display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: 12 }}>
        <div style={{ fontWeight: 600 }}>Work Types:</div>
        {['research', 'development', 'codeReview', 'reviewFeedback', 'defectCorrection', 'qa'].map(type => (
          <div key={type} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 16, height: 16, background: getWorkTypeColor(type), borderRadius: 3 }} />
            <span>{getWorkTypeLabel(type)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
