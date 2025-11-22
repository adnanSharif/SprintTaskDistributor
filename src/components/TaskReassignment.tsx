'use client';

import React, { useState } from 'react';
import { DeveloperScheduleSummary, Developer, Task } from '../types/index.d';

interface Props {
  schedules: DeveloperScheduleSummary[];
  developers: Developer[];
  tasks: Task[];
  onReassign: (taskId: string, workType: string, fromDev: string, toDev: string) => void;
}

export default function TaskReassignment({ schedules, developers, tasks, onReassign }: Props) {
  const [selectedTask, setSelectedTask] = useState<string | null>(null);
  const [selectedWorkType, setSelectedWorkType] = useState<string | null>(null);
  const [fromDeveloper, setFromDeveloper] = useState<string | null>(null);
  const [showReassignModal, setShowReassignModal] = useState(false);

  const getWorkTypeLabel = (type: string) => {
    switch (type) {
      case 'research': return '🔍 Research';
      case 'development': return '💻 Development';
      case 'codeReview': return '👀 Code Review';
      case 'reviewFeedback': return '🔄 Review Feedback';
      case 'defectCorrection': return '🐛 Defect Correction';
      case 'qa': return '✅ QA';
      default: return type;
    }
  };

  const handleSelectTask = (taskId: string, workType: string, developerId: string) => {
    setSelectedTask(taskId);
    setSelectedWorkType(workType);
    setFromDeveloper(developerId);
    setShowReassignModal(true);
  };

  const handleReassign = (toDevId: string) => {
    if (selectedTask && selectedWorkType && fromDeveloper) {
      onReassign(selectedTask, selectedWorkType, fromDeveloper, toDevId);
      setShowReassignModal(false);
      setSelectedTask(null);
      setSelectedWorkType(null);
      setFromDeveloper(null);
    }
  };

  const getAvailableDevelopers = () => {
    if (!selectedWorkType) return developers;
    
    // For code reviews, only show developers who can review
    if (selectedWorkType === 'codeReview') {
      return developers.filter(d => d.canReview && d.id !== fromDeveloper);
    }
    
    return developers.filter(d => d.id !== fromDeveloper);
  };

  const getTaskSummary = (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    return task ? task.summary : taskId;
  };

  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 16 }}>
        <h3 style={{ color: 'var(--primary)', fontWeight: 600, margin: 0, marginBottom: 8 }}>
          <span style={{ marginRight: 6 }}>🔄</span>Manual Task Reassignment
        </h3>
        <p style={{ fontSize: 13, color: 'var(--muted)', margin: 0 }}>
          Click on any work item to reassign it to a different developer
        </p>
      </div>

      {/* Developer task lists */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
        {schedules.map(devSchedule => {
          const dev = developers.find(d => d.id === devSchedule.developerId);
          
          return (
            <div
              key={devSchedule.developerId}
              style={{
                background: '#fff',
                border: '1px solid var(--border)',
                borderRadius: 8,
                padding: 16
              }}
            >
              <div style={{ marginBottom: 12, paddingBottom: 12, borderBottom: '2px solid var(--border)' }}>
                <div style={{ fontWeight: 600, fontSize: 15 }}>
                  {devSchedule.developerName}
                  {dev?.canReview && <span style={{ marginLeft: 6, fontSize: 12 }} title="Can perform code reviews">👀</span>}
                </div>
                <div style={{ fontSize: 12, color: 'var(--muted)' }}>
                  {devSchedule.taskAssignments.length} work items
                </div>
              </div>

              <div style={{ maxHeight: 400, overflowY: 'auto' }}>
                {devSchedule.taskAssignments.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: 24, color: 'var(--muted)', fontSize: 13 }}>
                    No tasks assigned
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {devSchedule.taskAssignments.map((assignment, idx) => (
                      <div
                        key={idx}
                        onClick={() => handleSelectTask(assignment.taskId, assignment.workType, devSchedule.developerId)}
                        style={{
                          background: '#f9fafb',
                          border: '1px solid #e5e7eb',
                          borderRadius: 6,
                          padding: 10,
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                          fontSize: 13
                        }}
                        onMouseEnter={e => {
                          e.currentTarget.style.background = '#f0f9ff';
                          e.currentTarget.style.borderColor = '#3b82f6';
                          e.currentTarget.style.transform = 'translateY(-1px)';
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.background = '#f9fafb';
                          e.currentTarget.style.borderColor = '#e5e7eb';
                          e.currentTarget.style.transform = 'translateY(0)';
                        }}
                      >
                        <div style={{ fontWeight: 500, marginBottom: 4, fontSize: 12, color: 'var(--muted)' }}>
                          {assignment.taskId}
                        </div>
                        <div style={{ marginBottom: 4, fontSize: 13 }}>
                          {getTaskSummary(assignment.taskId)}
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: 11, fontWeight: 600 }}>
                            {getWorkTypeLabel(assignment.workType)}
                          </span>
                          <span style={{ fontSize: 11, color: 'var(--muted)' }}>
                            {assignment.hours}h
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Reassignment Modal */}
      {showReassignModal && selectedTask && selectedWorkType && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', padding: 32, borderRadius: 12, boxShadow: '0 8px 32px rgba(0,0,0,0.2)', minWidth: 500, maxWidth: 600 }}>
            <h3 style={{ marginBottom: 20, color: 'var(--primary)' }}>
              🔄 Reassign Work Item
            </h3>

            <div style={{ marginBottom: 20, padding: 16, background: '#f9fafb', borderRadius: 8, border: '1px solid var(--border)' }}>
              <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 4 }}>Task ID</div>
              <div style={{ fontWeight: 600, marginBottom: 8 }}>{selectedTask}</div>
              <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 4 }}>Summary</div>
              <div style={{ marginBottom: 8 }}>{getTaskSummary(selectedTask)}</div>
              <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 4 }}>Work Type</div>
              <div style={{ fontWeight: 600 }}>{getWorkTypeLabel(selectedWorkType)}</div>
            </div>

            <div style={{ marginBottom: 24 }}>
              <label style={{ display: 'block', marginBottom: 12, fontWeight: 500 }}>
                Reassign to:
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 300, overflowY: 'auto' }}>
                {getAvailableDevelopers().map(dev => (
                  <button
                    key={dev.id}
                    onClick={() => handleReassign(dev.id)}
                    style={{
                      padding: 12,
                      textAlign: 'left',
                      background: '#fff',
                      border: '1px solid var(--border)',
                      borderRadius: 6,
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.background = '#f0f9ff';
                      e.currentTarget.style.borderColor = '#3b82f6';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.background = '#fff';
                      e.currentTarget.style.borderColor = 'var(--border)';
                    }}
                  >
                    <div style={{ fontWeight: 600, marginBottom: 4 }}>
                      {dev.name}
                      {dev.canReview && <span style={{ marginLeft: 6, fontSize: 12 }}>👀</span>}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--muted)' }}>
                      {dev.role} • {dev.dailyCapacity}h/day
                    </div>
                  </button>
                ))}
              </div>
              {selectedWorkType === 'codeReview' && getAvailableDevelopers().length === 0 && (
                <div style={{ padding: 16, background: '#fef3c7', borderRadius: 6, color: '#92400e', fontSize: 13 }}>
                  ⚠️ No other reviewers available. Only developers marked as "Can Review" can perform code reviews.
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  setShowReassignModal(false);
                  setSelectedTask(null);
                  setSelectedWorkType(null);
                  setFromDeveloper(null);
                }}
                style={{ background: 'var(--muted)' }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Instructions */}
      <div style={{ marginTop: 24, padding: 16, background: '#f0f9ff', border: '1px solid #bfdbfe', borderRadius: 8 }}>
        <div style={{ fontWeight: 600, marginBottom: 8, fontSize: 14 }}>💡 How to Reassign Tasks</div>
        <ul style={{ margin: 0, paddingLeft: 20, fontSize: 13, color: '#1e40af' }}>
          <li>Click on any work item to select it</li>
          <li>Choose the developer you want to reassign it to</li>
          <li>Code reviews can only be assigned to developers with the 👀 reviewer flag</li>
          <li>Note: Manual reassignments override the automatic scheduler</li>
        </ul>
      </div>
    </div>
  );
}
