'use client';

import React, { useMemo, useState } from 'react';
import { Developer, DeveloperScheduleSummary } from '../types/index.d';

interface Props {
  schedules: DeveloperScheduleSummary[];
  developers: Developer[];
  sprintStart: string;
  sprintEnd: string;
}

export default function DeveloperTimeline({ schedules, developers, sprintStart, sprintEnd }: Props) {
  const [selectedDev, setSelectedDev] = useState<string | 'all'>('all');
  const [showIdleTime, setShowIdleTime] = useState(true);

  const getDatesInRange = useMemo(() => {
    const dates: Date[] = [];
    const start = new Date(sprintStart + 'T00:00:00');
    const end = new Date(sprintEnd + 'T00:00:00');
    
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      dates.push(new Date(d));
    }
    return dates;
  }, [sprintStart, sprintEnd]);

  const formatDate = (date: Date) => date.toISOString().split('T')[0];

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
      case 'development': return '💻 Dev';
      case 'codeReview': return '👀 Review';
      case 'reviewFeedback': return '🔄 Feedback';
      case 'defectCorrection': return '🐛 Defects';
      case 'qa': return '✅ QA';
      case 'context-switch': return '⏱️ Switch';
      default: return type;
    }
  };

  const filteredSchedules = selectedDev === 'all'
    ? schedules
    : schedules.filter(s => s.developerId === selectedDev);

  const getIdleWarningLevel = (idlePercentage: number) => {
    if (idlePercentage > 40) return 'high';
    if (idlePercentage > 20) return 'medium';
    return 'low';
  };

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h3 style={{ color: 'var(--primary)', fontWeight: 600, margin: 0 }}>
          <span style={{ marginRight: 6 }}>👥</span>Developer-Specific Timeline
        </h3>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14 }}>
            <input
              type="checkbox"
              checked={showIdleTime}
              onChange={e => setShowIdleTime(e.target.checked)}
            />
            Show idle time
          </label>
          <select
            value={selectedDev}
            onChange={e => setSelectedDev(e.target.value)}
            style={{ padding: '6px 12px', fontSize: 14 }}
          >
            <option value="all">All Developers</option>
            {developers.map(dev => (
              <option key={dev.id} value={dev.id}>
                {dev.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Utilization Summary */}
      <div style={{ marginBottom: 24, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
        {filteredSchedules.map(devSchedule => {
          const dev = developers.find(d => d.id === devSchedule.developerId);
          const warningLevel = getIdleWarningLevel(devSchedule.idlePercentage);
          
          return (
            <div
              key={devSchedule.developerId}
              style={{
                background: '#f9fafb',
                borderRadius: 8,
                padding: 16,
                border: warningLevel === 'high' ? '2px solid #f59e0b' : '1px solid var(--border)'
              }}
              title={`Total capacity vs work hours`}
            >
              <div style={{ fontWeight: 600, marginBottom: 8, fontSize: 15 }}>
                {devSchedule.developerName}
                {dev?.canReview && <span style={{ marginLeft: 6, fontSize: 12 }}>👀</span>}
              </div>
              <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 4 }}>
                Work: {devSchedule.totalWorkHours}h
              </div>
              <div style={{ fontSize: 13, color: warningLevel === 'high' ? '#d97706' : 'var(--muted)', marginBottom: 8 }}>
                Idle: {devSchedule.totalIdleHours}h ({devSchedule.idlePercentage.toFixed(1)}%)
              </div>
              {warningLevel === 'high' && (
                <div style={{ fontSize: 12, color: '#d97706', background: '#fef3c7', padding: '4px 8px', borderRadius: 4 }}>
                  ⚠️ High idle time
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Timeline Grid */}
      <div style={{ border: '1px solid var(--border)', borderRadius: 8, background: '#fff', overflowX: 'auto' }}>
        {/* Header with dates */}
        <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', borderBottom: '2px solid var(--border)', background: '#f9fafb', position: 'sticky', top: 0, zIndex: 10 }}>
          <div style={{ padding: 12, fontWeight: 600, fontSize: 13, borderRight: '2px solid var(--border)' }}>
            Developer
          </div>
          <div style={{ position: 'relative', minWidth: 800 }}>
            <div style={{ display: 'flex', height: 50, alignItems: 'center' }}>
              {getDatesInRange.map((date, idx) => (
                <div
                  key={idx}
                  style={{
                    flex: 1,
                    textAlign: 'center',
                    fontSize: 10,
                    padding: 4,
                    borderLeft: idx === 0 ? 'none' : '1px solid #e5e7eb',
                    color: date.getDay() === 0 || date.getDay() === 6 ? 'var(--muted)' : 'inherit'
                  }}
                >
                  <div style={{ fontWeight: 500 }}>{date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
                  <div style={{ fontSize: 9, color: 'var(--muted)' }}>
                    {date.toLocaleDateString('en-US', { weekday: 'short' })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Developer rows */}
        <div style={{ maxHeight: 600, overflowY: 'auto' }}>
          {filteredSchedules.map(devSchedule => (
            <div
              key={devSchedule.developerId}
              style={{ borderBottom: '1px solid #f3f4f6', display: 'grid', gridTemplateColumns: '200px 1fr' }}
            >
              <div style={{ padding: 16, borderRight: '2px solid var(--border)', background: '#fafafa' }}>
                <div style={{ fontWeight: 600, marginBottom: 4 }}>{devSchedule.developerName}</div>
                <div style={{ fontSize: 11, color: 'var(--muted)' }}>
                  {devSchedule.totalWorkHours}h work / {devSchedule.totalIdleHours}h idle
                </div>
              </div>
              <div style={{ position: 'relative', minWidth: 800, minHeight: 60, background: '#fff' }}>
                <div style={{ display: 'flex', height: '100%' }}>
                  {getDatesInRange.map((date, idx) => {
                    const dateStr = formatDate(date);
                    const daySchedule = devSchedule.dailySchedule.find(d => d.date === dateStr);

                    return (
                      <div
                        key={idx}
                        style={{
                          flex: 1,
                          borderLeft: idx === 0 ? 'none' : '1px solid #f3f4f6',
                          position: 'relative',
                          minHeight: 60
                        }}
                        title={daySchedule ? `${daySchedule.totalHours}h work, ${daySchedule.idleHours}h idle` : 'No capacity'}
                      >
                        {daySchedule && daySchedule.workItems.length > 0 && (
                          <div style={{ padding: 4 }}>
                            {daySchedule.workItems.map((workItem, widx) => (
                              <div
                                key={widx}
                                style={{
                                  background: getWorkTypeColor(workItem.workType),
                                  color: '#fff',
                                  fontSize: 9,
                                  padding: '2px 4px',
                                  borderRadius: 3,
                                  marginBottom: 2,
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap'
                                }}
                                title={`${workItem.taskId}: ${workItem.taskSummary} (${getWorkTypeLabel(workItem.workType)}, ${workItem.hours}h)`}
                              >
                                {workItem.hours}h {getWorkTypeLabel(workItem.workType).split(' ')[0]}
                              </div>
                            ))}
                          </div>
                        )}
                        {showIdleTime && daySchedule && daySchedule.idleHours > 0 && (
                          <div
                            style={{
                              position: 'absolute',
                              bottom: 2,
                              left: 4,
                              right: 4,
                              background: '#e5e7eb',
                              fontSize: 8,
                              padding: '2px 4px',
                              borderRadius: 3,
                              textAlign: 'center',
                              color: '#6b7280'
                            }}
                            title={`${daySchedule.idleHours}h idle time`}
                          >
                            {daySchedule.idleHours}h idle
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ))}
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
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 16, height: 16, background: '#e5e7eb', borderRadius: 3 }} />
          <span>Idle Time</span>
        </div>
      </div>
    </div>
  );
}
