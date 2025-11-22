'use client';

import React, { useState } from 'react';
import { DeveloperScheduleSummary } from '../types/index.d';

interface Props {
  schedules: DeveloperScheduleSummary[];
  sprintStart: string;
  sprintEnd: string;
}

export default function DailyCalendarGrid({ schedules, sprintStart, sprintEnd }: Props) {
  const [expandedDays, setExpandedDays] = useState<Set<string>>(new Set());

  const toggleDay = (date: string) => {
    const newExpanded = new Set(expandedDays);
    if (newExpanded.has(date)) {
      newExpanded.delete(date);
    } else {
      newExpanded.add(date);
    }
    setExpandedDays(newExpanded);
  };

  const getWorkTypeColor = (type: string) => {
    switch (type) {
      case 'research': return '#8b5cf6';
      case 'development': return '#3b82f6';
      case 'codeReview': return '#ec4899';
      case 'reviewFeedback': return '#f59e0b';
      case 'defectCorrection': return '#ef4444';
      case 'qa': return '#10b981';
      case 'context-switch': return '#9ca3af';
      default: return '#6b7280';
    }
  };

  const getWorkTypeLabel = (type: string) => {
    switch (type) {
      case 'research': return '🔍 Research';
      case 'development': return '💻 Development';
      case 'codeReview': return '👀 Code Review';
      case 'reviewFeedback': return '🔄 Review Feedback';
      case 'defectCorrection': return '🐛 Defect Correction';
      case 'qa': return '✅ QA';
      case 'context-switch': return '⏱️ Context Switch';
      default: return type;
    }
  };

  // Collect all unique dates from all schedules
  const allDates = Array.from(
    new Set(
      schedules.flatMap(s => s.dailySchedule.map(d => d.date))
    )
  ).sort();

  const getDayOfWeek = (dateStr: string) => {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('en-US', { weekday: 'long' });
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 16 }}>
        <h3 style={{ color: 'var(--primary)', fontWeight: 600, margin: 0, marginBottom: 8 }}>
          <span style={{ marginRight: 6 }}>📅</span>Daily Calendar Grid
        </h3>
        <p style={{ fontSize: 13, color: 'var(--muted)', margin: 0 }}>
          Click on any day to expand and see detailed work item breakdown
        </p>
      </div>

      <div style={{ border: '1px solid var(--border)', borderRadius: 8, background: '#fff' }}>
        {allDates.map((dateStr, idx) => {
          const isExpanded = expandedDays.has(dateStr);
          const dayOfWeek = getDayOfWeek(dateStr);
          const isWeekend = dayOfWeek === 'Saturday' || dayOfWeek === 'Sunday';

          // Get all developer schedules for this day
          const daySchedules = schedules
            .map(devSchedule => ({
              developerName: devSchedule.developerName,
              daySchedule: devSchedule.dailySchedule.find(d => d.date === dateStr)
            }))
            .filter(ds => ds.daySchedule);

          const totalWorkHours = daySchedules.reduce((sum, ds) => sum + (ds.daySchedule?.totalHours || 0), 0);
          const totalIdleHours = daySchedules.reduce((sum, ds) => sum + (ds.daySchedule?.idleHours || 0), 0);

          return (
            <div
              key={dateStr}
              style={{
                borderBottom: idx === allDates.length - 1 ? 'none' : '1px solid var(--border)',
                background: isWeekend ? '#fafafa' : '#fff'
              }}
            >
              {/* Day header - clickable */}
              <div
                onClick={() => toggleDay(dateStr)}
                style={{
                  padding: 16,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  cursor: 'pointer',
                  background: isExpanded ? '#f0f9ff' : 'transparent',
                  transition: 'background 0.2s'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontSize: 18 }}>
                    {isExpanded ? '▼' : '▶'}
                  </span>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 15 }}>
                      {formatDate(dateStr)} - {dayOfWeek}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>
                      {daySchedules.length} developer{daySchedules.length !== 1 ? 's' : ''} with work scheduled
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 16, fontSize: 13 }}>
                  <div title="Total work hours across all developers">
                    💼 {totalWorkHours}h work
                  </div>
                  <div title="Total idle hours across all developers" style={{ color: totalIdleHours > 0 ? '#d97706' : 'var(--muted)' }}>
                    ⏸️ {totalIdleHours}h idle
                  </div>
                </div>
              </div>

              {/* Expanded content */}
              {isExpanded && (
                <div style={{ padding: '0 16px 16px 16px', background: '#f9fafb' }}>
                  <div style={{ display: 'grid', gap: 12 }}>
                    {daySchedules.map(({ developerName, daySchedule }) => {
                      if (!daySchedule) return null;

                      return (
                        <div
                          key={developerName}
                          style={{
                            background: '#fff',
                            border: '1px solid var(--border)',
                            borderRadius: 6,
                            padding: 12
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                            <div style={{ fontWeight: 600 }}>{developerName}</div>
                            <div style={{ fontSize: 12, color: 'var(--muted)' }}>
                              {daySchedule.totalHours}h work
                              {daySchedule.idleHours > 0 && (
                                <span style={{ marginLeft: 8, color: '#d97706' }}>
                                  + {daySchedule.idleHours}h idle
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Work items */}
                          {daySchedule.workItems.length > 0 ? (
                            <div style={{ display: 'grid', gap: 6 }}>
                              {daySchedule.workItems.map((workItem, widx) => (
                                <div
                                  key={widx}
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 8,
                                    padding: 8,
                                    background: '#f9fafb',
                                    borderLeft: `4px solid ${getWorkTypeColor(workItem.workType)}`,
                                    borderRadius: 4,
                                    fontSize: 13
                                  }}
                                >
                                  <div
                                    style={{
                                      background: getWorkTypeColor(workItem.workType),
                                      color: '#fff',
                                      padding: '2px 8px',
                                      borderRadius: 4,
                                      fontSize: 11,
                                      fontWeight: 600,
                                      minWidth: 120,
                                      textAlign: 'center'
                                    }}
                                    title={getWorkTypeLabel(workItem.workType)}
                                  >
                                    {getWorkTypeLabel(workItem.workType)}
                                  </div>
                                  <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: 500 }}>
                                      {workItem.taskId}: {workItem.taskSummary}
                                    </div>
                                  </div>
                                  <div style={{ fontWeight: 600, color: getWorkTypeColor(workItem.workType), minWidth: 50, textAlign: 'right' }}>
                                    {workItem.hours}h
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div style={{ fontSize: 13, color: 'var(--muted)', fontStyle: 'italic' }}>
                              No work items scheduled
                            </div>
                          )}

                          {/* Idle time indicator */}
                          {daySchedule.idleHours > 0 && (
                            <div
                              style={{
                                marginTop: 8,
                                padding: 8,
                                background: '#fef3c7',
                                borderRadius: 4,
                                fontSize: 12,
                                color: '#d97706',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 6
                              }}
                            >
                              <span>⚠️</span>
                              {daySchedule.idleHours}h of idle time - consider assigning additional tasks
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Summary footer */}
      <div style={{ marginTop: 16, padding: 16, background: '#f9fafb', borderRadius: 8, border: '1px solid var(--border)' }}>
        <div style={{ fontWeight: 600, marginBottom: 8 }}>Sprint Summary</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, fontSize: 13 }}>
          <div>
            <div style={{ color: 'var(--muted)' }}>Total Work Days</div>
            <div style={{ fontWeight: 600, fontSize: 18, color: 'var(--primary)' }}>{allDates.length}</div>
          </div>
          <div>
            <div style={{ color: 'var(--muted)' }}>Total Work Hours</div>
            <div style={{ fontWeight: 600, fontSize: 18, color: '#3b82f6' }}>
              {allDates.reduce((sum, date) => {
                const daySchedules = schedules.map(s => s.dailySchedule.find(d => d.date === date)).filter(Boolean);
                return sum + daySchedules.reduce((daySum, ds) => daySum + (ds?.totalHours || 0), 0);
              }, 0)}h
            </div>
          </div>
          <div>
            <div style={{ color: 'var(--muted)' }}>Total Idle Hours</div>
            <div style={{ fontWeight: 600, fontSize: 18, color: '#d97706' }}>
              {allDates.reduce((sum, date) => {
                const daySchedules = schedules.map(s => s.dailySchedule.find(d => d.date === date)).filter(Boolean);
                return sum + daySchedules.reduce((daySum, ds) => daySum + (ds?.idleHours || 0), 0);
              }, 0)}h
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
