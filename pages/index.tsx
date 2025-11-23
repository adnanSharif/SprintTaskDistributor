'use client';

import Head from 'next/head';
import Link from 'next/link';
import React, { useState, useEffect } from 'react';
import UploadCSV from '../src/components/UploadCSV';
import TeamRoster from '../src/components/TeamRoster';
import SprintConfig from '../src/components/SprintConfig';
import DeveloperCapacityCalendar from '../src/components/DeveloperCapacityCalendar';
import TaskManager from '../src/components/TaskManager';
import GanttTimeline from '../src/components/GanttTimeline';
import { Developer, Task, SprintConfig as SprintConfigType, DeveloperScheduleSummary } from '../src/types/index.d';
import { scheduleTasksWithDependencies, ScheduleResult } from '../src/lib/schedulerEnhanced';
import { exportTasksToCSV } from '../src/lib/csv';
import { 
  exportAllDevelopersSchedule, 
  exportTaskFocusedSchedule, 
  exportIndividualDeveloperSchedules, 
  exportDeveloperUtilization 
} from '../src/lib/exportSchedules';
import DeveloperTimeline from '../src/components/DeveloperTimeline';
import DailyCalendarGrid from '../src/components/DailyCalendarGrid';
import TaskReassignment from '../src/components/TaskReassignment';

interface CsvImportPayload {
  tasks?: Task[];
  team?: Developer[];
}

export default function Home() {
  // Get today's date for defaults
  const today = new Date().toISOString().split('T')[0];
  const twoWeeksLater = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const [developers, setDevelopers] = useState<Developer[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [step, setStep] = useState(1); // 1: Configure, 2: Tasks, 3: Review, 4: Timeline
  const [sprintConfig, setSprintConfig] = useState<SprintConfigType>({
    startDate: today,
    endDate: twoWeeksLater,
    workDays: [1, 2, 3, 4, 5], // Mon-Fri
    holidays: []
  });
  const [scheduleResult, setScheduleResult] = useState<ScheduleResult | null>(null);
  const [developerSchedules, setDeveloperSchedules] = useState<DeveloperScheduleSummary[]>([]);
  const [exportMenuOpen, setExportMenuOpen] = useState(false);

  const hasDevelopers = developers.length > 0;
  const hasTasks = tasks.length > 0;

  // Auto-schedule when moving to timeline view
  useEffect(() => {
    if (step !== 4) return;
    if (!developers.length || !tasks.length) return;

    const result = scheduleTasksWithDependencies(tasks, developers, sprintConfig);
    setScheduleResult(result);
    setDeveloperSchedules(result.developerSchedules || []);

    const hasTaskChanges = result.tasks.some((scheduledTask, idx) => {
      const currentTask = tasks[idx];
      if (!currentTask) return true;
      return (
        currentTask.scheduledStart !== scheduledTask.scheduledStart ||
        currentTask.scheduledEnd !== scheduledTask.scheduledEnd ||
        currentTask.assignedTo !== scheduledTask.assignedTo
      );
    });

    if (hasTaskChanges) {
      setTasks(result.tasks);
    }
  }, [step, developers, tasks, sprintConfig]);

  const handleCSVImport = (data: CsvImportPayload) => {
    const importedTasks = data.tasks;
    const importedTeam = data.team;

    if (importedTasks && importedTasks.length > 0) {
      setTasks(prev => [...prev, ...importedTasks]);
    }
    if (importedTeam && importedTeam.length > 0) {
      setDevelopers(prev => {
        const merged = [...prev];
        importedTeam.forEach((newDev: Developer) => {
          const exists = merged.some(d => d.name === newDev.name);
          if (!exists) {
            merged.push(newDev);
          }
        });
        return merged;
      });
    }
  };

  const handleExport = () => {
    if (scheduleResult) {
      exportTasksToCSV(scheduleResult.tasks, `sprint_plan_${sprintConfig.startDate}.csv`);
    }
  };

  const handleExportAllDevelopers = () => {
    if (developerSchedules.length > 0) {
      exportAllDevelopersSchedule(developerSchedules, `developer_schedules_${sprintConfig.startDate}.csv`);
      setExportMenuOpen(false);
    }
  };

  const handleExportTaskFocused = () => {
    if (developerSchedules.length > 0) {
      exportTaskFocusedSchedule(developerSchedules, `task_completion_${sprintConfig.startDate}.csv`);
      setExportMenuOpen(false);
    }
  };

  const handleExportIndividual = () => {
    if (developerSchedules.length > 0) {
      exportIndividualDeveloperSchedules(developerSchedules, sprintConfig.startDate);
      setExportMenuOpen(false);
    }
  };

  const handleExportUtilization = () => {
    if (developerSchedules.length > 0) {
      exportDeveloperUtilization(developerSchedules, `developer_utilization_${sprintConfig.startDate}.csv`);
      setExportMenuOpen(false);
    }
  };

  const handleTaskReassignment = (taskId: string, workType: string, fromDev: string, toDev: string) => {
    // Note: This would require re-running the scheduler with manual overrides
    // For now, just show a message that this feature requires full implementation
    alert(`Reassigning ${taskId} (${workType}) from ${fromDev} to ${toDev}\n\nNote: This feature requires re-scheduling with manual overrides. The schedule will be regenerated on next timeline generation.`);
    // TODO: Implement scheduler with manual assignment overrides
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
      <Head>
        <title>Sprint Task Distributor - Advanced Sprint Planning</title>
        <meta name="description" content="Plan sprints with task dependencies, capacity calendars, and Gantt timeline" />
      </Head>

      {/* Header */}
      <div style={{ background: 'rgba(255,255,255,0.95)', borderBottom: '1px solid #e5e7eb', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px' }}>
          <h1 style={{ margin: 0, fontSize: '1.8rem', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            🚀 Sprint Task Distributor
          </h1>
          <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
            {scheduleResult && developerSchedules.length > 0 && (
              <div style={{ position: 'relative' }}>
                <button
                  onClick={() => setExportMenuOpen(!exportMenuOpen)}
                  className="success"
                  style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: 6 }}
                >
                  📥 Export
                  <span style={{ fontSize: 12 }}>{exportMenuOpen ? '▲' : '▼'}</span>
                </button>
                {exportMenuOpen && (
                  <div style={{
                    position: 'absolute',
                    top: '100%',
                    right: 0,
                    marginTop: 4,
                    background: '#fff',
                    border: '1px solid var(--border)',
                    borderRadius: 8,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                    minWidth: 220,
                    zIndex: 100
                  }}>
                    <div style={{ padding: '8px 0' }}>
                      <div
                        onClick={handleExportAllDevelopers}
                        style={{
                          padding: '10px 16px',
                          cursor: 'pointer',
                          transition: 'background 0.2s'
                        }}
                        onMouseEnter={e => (e.currentTarget.style.background = '#f3f4f6')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                      >
                        <div style={{ fontWeight: 500, fontSize: 14 }}>📊 All Developers</div>
                        <div style={{ fontSize: 11, color: 'var(--muted)' }}>Daily breakdown with idle time</div>
                      </div>
                      <div
                        onClick={handleExportTaskFocused}
                        style={{
                          padding: '10px 16px',
                          cursor: 'pointer',
                          transition: 'background 0.2s'
                        }}
                        onMouseEnter={e => (e.currentTarget.style.background = '#f3f4f6')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                      >
                        <div style={{ fontWeight: 500, fontSize: 14 }}>📋 Task-Focused</div>
                        <div style={{ fontSize: 11, color: 'var(--muted)' }}>Task completion dates</div>
                      </div>
                      <div
                        onClick={handleExportIndividual}
                        style={{
                          padding: '10px 16px',
                          cursor: 'pointer',
                          transition: 'background 0.2s'
                        }}
                        onMouseEnter={e => (e.currentTarget.style.background = '#f3f4f6')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                      >
                        <div style={{ fontWeight: 500, fontSize: 14 }}>👤 Individual CSVs</div>
                        <div style={{ fontSize: 11, color: 'var(--muted)' }}>Separate file per developer</div>
                      </div>
                      <div
                        onClick={handleExportUtilization}
                        style={{
                          padding: '10px 16px',
                          cursor: 'pointer',
                          transition: 'background 0.2s'
                        }}
                        onMouseEnter={e => (e.currentTarget.style.background = '#f3f4f6')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                      >
                        <div style={{ fontWeight: 500, fontSize: 14 }}>📈 Utilization Summary</div>
                        <div style={{ fontSize: 11, color: 'var(--muted)' }}>Idle % and task count</div>
                      </div>
                      <div style={{ borderTop: '1px solid var(--border)', margin: '4px 0' }} />
                      <div
                        onClick={handleExport}
                        style={{
                          padding: '10px 16px',
                          cursor: 'pointer',
                          transition: 'background 0.2s'
                        }}
                        onMouseEnter={e => (e.currentTarget.style.background = '#f3f4f6')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                      >
                        <div style={{ fontWeight: 500, fontSize: 14 }}>📝 Classic Export</div>
                        <div style={{ fontSize: 11, color: 'var(--muted)' }}>Original format</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
            <Link href="/faq" style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: 500 }}>❓ FAQ</Link>
          </div>
        </div>
      </div>

      <div className="container" style={{ paddingTop: 32, paddingBottom: 48 }}>
        {/* Hero Section */}
        {!hasDevelopers && !hasTasks && (
          <div className="card" style={{ textAlign: 'center', padding: 48, marginBottom: 32, background: 'rgba(255,255,255,0.98)' }}>
            <h2 style={{ fontSize: '2rem', marginBottom: 16, color: 'var(--primary)' }}>
              Advanced Sprint Planning with Dependencies
            </h2>
            <p style={{ fontSize: '1.1rem', color: 'var(--muted)', marginBottom: 24, maxWidth: 700, margin: '0 auto 24px' }}>
              Plan sprints with task breakdown (Research → Dev → Review → Feedback), handle dependencies,
              configure individual developer capacity, and visualize in Gantt timeline.
            </p>
            <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap', fontSize: 14 }}>
              <div style={{ textAlign: 'center', flex: '0 0 150px' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: 8 }}>📅</div>
                <div style={{ fontWeight: 600 }}>Configure Sprint</div>
                <div style={{ fontSize: 13, color: 'var(--muted)' }}>Dates & Holidays</div>
              </div>
              <div style={{ fontSize: '2rem', color: 'var(--muted)' }}>→</div>
              <div style={{ textAlign: 'center', flex: '0 0 150px' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: 8 }}>👥</div>
                <div style={{ fontWeight: 600 }}>Team & Capacity</div>
                <div style={{ fontSize: 13, color: 'var(--muted)' }}>PTO & Custom Hours</div>
              </div>
              <div style={{ fontSize: '2rem', color: 'var(--muted)' }}>→</div>
              <div style={{ textAlign: 'center', flex: '0 0 150px' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: 8 }}>📋</div>
                <div style={{ fontWeight: 600 }}>Task Breakdown</div>
                <div style={{ fontSize: 13, color: 'var(--muted)' }}>Work Types & Deps</div>
              </div>
              <div style={{ fontSize: '2rem', color: 'var(--muted)' }}>→</div>
              <div style={{ textAlign: 'center', flex: '0 0 150px' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: 8 }}>📊</div>
                <div style={{ fontWeight: 600 }}>Gantt Timeline</div>
                <div style={{ fontSize: 13, color: 'var(--muted)' }}>Auto-Schedule</div>
              </div>
            </div>
          </div>
        )}

        {/* Progress Indicator */}
        {(hasDevelopers || hasTasks) && (
          <div className="card" style={{ marginBottom: 24, padding: 24, background: 'rgba(255,255,255,0.98)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center' }}>
              {[
                { num: 1, label: 'Configure', sub: 'Sprint & Team' },
                { num: 2, label: 'Tasks', sub: 'Breakdown & Deps' },
                { num: 3, label: 'Review', sub: 'Validate Setup' },
                { num: 4, label: 'Timeline', sub: 'Gantt View' }
              ].map((s, idx) => (
                <React.Fragment key={s.num}>
                  {idx > 0 && (
                    <div style={{ height: 2, flex: 1, background: step >= s.num ? 'var(--success)' : '#e5e7eb', margin: '0 16px' }} />
                  )}
                  <div
                    style={{ textAlign: 'center', flex: 1, cursor: 'pointer' }}
                    onClick={() => setStep(s.num)}
                  >
                    <div style={{
                      width: 48,
                      height: 48,
                      borderRadius: '50%',
                      background: step >= s.num ? 'var(--success)' : '#e5e7eb',
                      color: '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto',
                      fontSize: '1.5rem',
                      fontWeight: 700
                    }}>
                      {step > s.num ? '✓' : s.num}
                    </div>
                    <div style={{ marginTop: 8, fontWeight: 600, color: step >= s.num ? 'var(--success)' : 'var(--muted)' }}>
                      {s.label}
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--muted)' }}>{s.sub}</div>
                  </div>
                </React.Fragment>
              ))}
            </div>
          </div>
        )}

        {/* Step 1: Configure Sprint & Team */}
        {step === 1 && (
          <div>
            {/* CSV Import */}
            <div className="card" style={{ background: 'rgba(255,255,255,0.98)', marginBottom: 24 }}>
              <div style={{ padding: 24 }}>
                <h3 style={{ color: 'var(--primary)', fontWeight: 600, marginBottom: 16 }}>
                  <span style={{ marginRight: 6 }}>📁</span>Quick Import
                </h3>
                <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>
                  <div style={{ flex: '0 0 280px' }}>
                    <UploadCSV onImport={handleCSVImport} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 14, color: 'var(--muted)', marginBottom: 12 }}>
                      Import tasks or team from CSV. See <code>samples/</code> folder for format examples.
                    </p>
                    <div style={{ fontSize: 13, color: 'var(--muted)', background: '#f9fafb', padding: 12, borderRadius: 6 }}>
                      <strong>Expected columns:</strong>
                      <br />• <strong>Tasks:</strong> Issue key, Summary, Priority, Research/Development/Code Review/Review Feedback/Defect Correction/QA Hours, Dependencies
                      <br />• <strong>Team:</strong> Name, Role, Daily Capacity (hours)
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>
              <div className="card" style={{ background: 'rgba(255,255,255,0.98)' }}>
                <SprintConfig config={sprintConfig} onChange={setSprintConfig} />
              </div>
              <div className="card" style={{ background: 'rgba(255,255,255,0.98)' }}>
                <TeamRoster team={developers} setTeam={setDevelopers} />
              </div>
            </div>

            {developers.length > 0 && (
              <div className="card" style={{ background: 'rgba(255,255,255,0.98)', marginBottom: 24 }}>
                <DeveloperCapacityCalendar
                  developers={developers}
                  sprintStart={sprintConfig.startDate}
                  sprintEnd={sprintConfig.endDate}
                  workDays={sprintConfig.workDays}
                  holidays={sprintConfig.holidays}
                  onChange={setDevelopers}
                />
              </div>
            )}

            <div style={{ textAlign: 'center' }}>
              <button
                onClick={() => setStep(2)}
                disabled={!hasDevelopers}
                style={{
                  padding: '14px 40px',
                  fontSize: '1.1rem',
                  opacity: hasDevelopers ? 1 : 0.5,
                  cursor: hasDevelopers ? 'pointer' : 'not-allowed'
                }}
              >
                Continue to Tasks →
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Manage Tasks */}
        {step === 2 && (
          <div>
            <div className="card" style={{ background: 'rgba(255,255,255,0.98)', marginBottom: 24 }}>
              <TaskManager tasks={tasks} onChange={setTasks} />
            </div>

            {tasks.length === 0 && (
              <div style={{ padding: 16, background: '#fef9c3', border: '1px solid #fde047', borderRadius: 8, marginBottom: 16, color: '#854d0e' }}>
                ⚠️ Add tasks manually or import from CSV to continue.
              </div>
            )}

            <div style={{ textAlign: 'center', display: 'flex', gap: 12, justifyContent: 'center' }}>
              <button onClick={() => setStep(1)} style={{ background: 'var(--muted)' }}>
                ← Back
              </button>
              <button
                onClick={() => setStep(3)}
                disabled={tasks.length === 0}
                style={{
                  padding: '14px 40px',
                  fontSize: '1.1rem',
                  opacity: tasks.length > 0 ? 1 : 0.5,
                  cursor: tasks.length > 0 ? 'pointer' : 'not-allowed'
                }}
              >
                Continue to Review →
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Review Setup */}
        {step === 3 && (
          <div>
            <div className="card" style={{ background: 'rgba(255,255,255,0.98)', marginBottom: 24, padding: 24 }}>
              <h3 style={{ color: 'var(--primary)', fontWeight: 600, marginBottom: 16 }}>
                <span style={{ marginRight: 6 }}>✅</span>Review Configuration
              </h3>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                <div>
                  <h4 style={{ marginBottom: 12, fontSize: 16 }}>Sprint Details</h4>
                  <div style={{ background: '#f9fafb', padding: 16, borderRadius: 8, fontSize: 14 }}>
                    <div style={{ marginBottom: 8 }}>
                      <strong>Start:</strong> {new Date(sprintConfig.startDate + 'T00:00:00').toLocaleDateString()}
                    </div>
                    <div style={{ marginBottom: 8 }}>
                      <strong>End:</strong> {new Date(sprintConfig.endDate + 'T00:00:00').toLocaleDateString()}
                    </div>
                    <div style={{ marginBottom: 8 }}>
                      <strong>Work Days:</strong> {sprintConfig.workDays.map(d => ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d]).join(', ')}
                    </div>
                    <div>
                      <strong>Holidays:</strong> {sprintConfig.holidays.length} configured
                    </div>
                  </div>
                </div>

                <div>
                  <h4 style={{ marginBottom: 12, fontSize: 16 }}>Team Summary</h4>
                  <div style={{ background: '#f9fafb', padding: 16, borderRadius: 8, fontSize: 14 }}>
                    <div style={{ marginBottom: 8 }}>
                      <strong>Developers:</strong> {developers.length}
                    </div>
                    <div style={{ marginBottom: 8 }}>
                      <strong>Total Daily Capacity:</strong> {developers.reduce((sum, d) => sum + d.dailyCapacity, 0)}h
                    </div>
                    <div>
                      <strong>PTO Days:</strong> {developers.reduce((sum, d) => sum + (d.ptoDates?.length || 0), 0)} total
                    </div>
                  </div>
                </div>

                <div>
                  <h4 style={{ marginBottom: 12, fontSize: 16 }}>Tasks Summary</h4>
                  <div style={{ background: '#f9fafb', padding: 16, borderRadius: 8, fontSize: 14 }}>
                    <div style={{ marginBottom: 8 }}>
                      <strong>Total Tasks:</strong> {tasks.length}
                    </div>
                    <div style={{ marginBottom: 8 }}>
                      <strong>Critical:</strong> {tasks.filter(t => t.priority === 'Critical').length}
                    </div>
                    <div style={{ marginBottom: 8 }}>
                      <strong>High:</strong> {tasks.filter(t => t.priority === 'High').length}
                    </div>
                    <div>
                      <strong>Dependencies:</strong> {tasks.filter(t => t.dependencies && t.dependencies.length > 0).length} tasks have deps
                    </div>
                  </div>
                </div>

                <div>
                  <h4 style={{ marginBottom: 12, fontSize: 16 }}>Work Breakdown</h4>
                  <div style={{ background: '#f9fafb', padding: 16, borderRadius: 8, fontSize: 14 }}>
                    {(() => {
                      const totals = tasks.reduce((acc, t) => ({
                        research: acc.research + t.work.research,
                        dev: acc.dev + t.work.development,
                        review: acc.review + t.work.codeReview,
                        feedback: acc.feedback + t.work.reviewFeedback,
                        defects: acc.defects + t.work.defectCorrection,
                        qa: acc.qa + (t.work.qa || 0)
                      }), { research: 0, dev: 0, review: 0, feedback: 0, defects: 0, qa: 0 });
                      const total = Object.values(totals).reduce((a, b) => a + b, 0);

                      return (
                        <>
                          <div style={{ marginBottom: 8 }}><strong>Total Hours:</strong> {total}h</div>
                          <div style={{ fontSize: 12, color: 'var(--muted)' }}>
                            Research: {totals.research}h | Dev: {totals.dev}h | Review: {totals.review}h |
                            Feedback: {totals.feedback}h | Defects: {totals.defects}h | QA: {totals.qa}h
                          </div>
                        </>
                      );
                    })()}
                  </div>
                </div>
              </div>
            </div>

            <div style={{ textAlign: 'center', display: 'flex', gap: 12, justifyContent: 'center' }}>
              <button onClick={() => setStep(2)} style={{ background: 'var(--muted)' }}>
                ← Back
              </button>
              <button
                onClick={() => setStep(4)}
                className="success"
                style={{ padding: '14px 40px', fontSize: '1.1rem' }}
              >
                Generate Timeline →
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Gantt Timeline */}
        {step === 4 && scheduleResult && (
          <div>
            <div className="card" style={{ background: 'rgba(255,255,255,0.98)', marginBottom: 24 }}>
              <GanttTimeline
                scheduleResult={scheduleResult}
                developers={developers}
                sprintStart={sprintConfig.startDate}
                sprintEnd={sprintConfig.endDate}
              />
            </div>

            {developerSchedules.length > 0 && (
              <>
                <div className="card" style={{ background: 'rgba(255,255,255,0.98)', marginBottom: 24 }}>
                  <DeveloperTimeline
                    schedules={developerSchedules}
                    developers={developers}
                    sprintStart={sprintConfig.startDate}
                    sprintEnd={sprintConfig.endDate}
                  />
                </div>

                <div className="card" style={{ background: 'rgba(255,255,255,0.98)', marginBottom: 24 }}>
                  <DailyCalendarGrid
                    schedules={developerSchedules}
                  />
                </div>

                <div className="card" style={{ background: 'rgba(255,255,255,0.98)', marginBottom: 24 }}>
                  <TaskReassignment
                    schedules={developerSchedules}
                    developers={developers}
                    tasks={tasks}
                    onReassign={handleTaskReassignment}
                  />
                </div>
              </>
            )}

            <div style={{ textAlign: 'center' }}>
              <button onClick={() => setStep(3)} style={{ background: 'var(--muted)' }}>
                ← Back to Review
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
