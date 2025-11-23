'use client';

import React, { useState } from 'react';
import { Task, WorkBreakdown } from '../types/index.d';

type TaskDraft = Partial<Omit<Task, 'work' | 'priority' | 'dependencies' | 'status'>> & {
  work: WorkBreakdown;
  priority?: Task['priority'];
  dependencies?: string[];
  status?: Task['status'];
};

interface Props {
  tasks: Task[];
  onChange: (tasks: Task[]) => void;
}

export default function TaskManager({ tasks, onChange }: Props) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskDraft | null>(null);
  const [newTask, setNewTask] = useState<TaskDraft>({
    summary: '',
    priority: 'Medium',
    work: {
      research: 0,
      development: 0,
      codeReview: 0,
      reviewFeedback: 0,
      defectCorrection: 0,
      qa: 0
    },
    dependencies: []
  });

  const addTask = () => {
    const task: Task = {
      id: `TASK-${Date.now()}`,
      summary: newTask.summary || 'Untitled Task',
      priority: newTask.priority ?? 'Medium',
      work: newTask.work,
      dependencies: newTask.dependencies || [],
      status: 'Not Started'
    };
    onChange([...tasks, task]);
    setShowAddModal(false);
    resetNewTask();
  };

  const updateTask = () => {
    if (!editingTask) return;
    if (!editingTask.id) return;
    onChange(tasks.map(t => (t.id === editingTask.id ? { ...t, ...editingTask } as Task : t)));
    setEditingTask(null);
  };

  const deleteTask = (id: string) => {
    if (confirm('Delete this task?')) {
      const withoutTask = tasks.filter(t => t.id !== id);
      const cleaned = withoutTask.map(t => ({
        ...t,
        dependencies: t.dependencies?.filter(dep => dep !== id)
      }));
      onChange(cleaned);
    }
  };

  const resetNewTask = () => {
    setNewTask({
      summary: '',
      priority: 'Medium',
      work: {
        research: 0,
        development: 0,
        codeReview: 0,
        reviewFeedback: 0,
        defectCorrection: 0,
        qa: 0
      },
      dependencies: []
    });
  };

  const getTotalHours = (work: WorkBreakdown) => {
    return (work.research || 0) + (work.development || 0) + (work.codeReview || 0) + 
           (work.reviewFeedback || 0) + (work.defectCorrection || 0) + (work.qa || 0);
  };

  const TaskForm = ({ task, setTask, onSave, onCancel }: { task: TaskDraft; setTask: (draft: TaskDraft) => void; onSave: () => void; onCancel: () => void }) => {
    const toggleDependency = (depId: string) => {
      const deps = task.dependencies || [];
      const newDeps = deps.includes(depId)
        ? deps.filter((d: string) => d !== depId)
        : [...deps, depId];
      setTask({ ...task, dependencies: newDeps });
    };

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <label style={{ display: 'block', marginBottom: 6, fontWeight: 500 }}>Task Summary</label>
          <input
            value={task.summary ?? ''}
            onChange={e => setTask({ ...task, summary: e.target.value })}
            placeholder="e.g., Implement user authentication"
            style={{ width: '100%' }}
          />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: 6, fontWeight: 500 }}>Priority</label>
          <select
            value={task.priority ?? 'Medium'}
            onChange={e => setTask({ ...task, priority: e.target.value as Task['priority'] })}
            style={{ width: '100%', padding: 10 }}
          >
            <option value="Critical">Critical</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: 10, fontWeight: 500 }}>Work Breakdown (hours)</label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ fontSize: 13, color: 'var(--muted)' }}>🔍 Research</label>
              <input
                type="number"
                min={0}
                step={0.5}
                value={task.work?.research || 0}
                onChange={e => setTask({ ...task, work: { ...task.work, research: Number(e.target.value) } })}
                style={{ width: '100%' }}
              />
            </div>
            <div>
              <label style={{ fontSize: 13, color: 'var(--muted)' }}>💻 Development</label>
              <input
                type="number"
                min={0}
                step={0.5}
                value={task.work?.development || 0}
                onChange={e => setTask({ ...task, work: { ...task.work, development: Number(e.target.value) } })}
                style={{ width: '100%' }}
              />
            </div>
            <div>
              <label style={{ fontSize: 13, color: 'var(--muted)' }}>👀 Code Review</label>
              <input
                type="number"
                min={0}
                step={0.5}
                value={task.work?.codeReview || 0}
                onChange={e => setTask({ ...task, work: { ...task.work, codeReview: Number(e.target.value) } })}
                style={{ width: '100%' }}
              />
            </div>
            <div>
              <label style={{ fontSize: 13, color: 'var(--muted)' }}>🔄 Review Feedback</label>
              <input
                type="number"
                min={0}
                step={0.5}
                value={task.work?.reviewFeedback || 0}
                onChange={e => setTask({ ...task, work: { ...task.work, reviewFeedback: Number(e.target.value) } })}
                style={{ width: '100%' }}
              />
            </div>
            <div>
              <label style={{ fontSize: 13, color: 'var(--muted)' }}>🐛 Defect Correction</label>
              <input
                type="number"
                min={0}
                step={0.5}
                value={task.work?.defectCorrection || 0}
                onChange={e => setTask({ ...task, work: { ...task.work, defectCorrection: Number(e.target.value) } })}
                style={{ width: '100%' }}
              />
            </div>
            <div>
              <label style={{ fontSize: 13, color: 'var(--muted)' }}>✅ QA Testing</label>
              <input
                type="number"
                min={0}
                step={0.5}
                value={task.work?.qa || 0}
                onChange={e => setTask({ ...task, work: { ...task.work, qa: Number(e.target.value) } })}
                style={{ width: '100%' }}
              />
            </div>
          </div>
          <div style={{ marginTop: 8, fontSize: 13, color: 'var(--muted)', background: '#f9fafb', padding: 8, borderRadius: 4 }}>
            Total: <strong>{getTotalHours(task.work || {})}</strong> hours
          </div>
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: 6, fontWeight: 500 }}>Dependencies</label>
          {tasks.filter(t => t.id !== task.id).length === 0 ? (
            <div style={{ fontSize: 13, color: 'var(--muted)', background: '#f9fafb', padding: 12, borderRadius: 6 }}>
              No other tasks available
            </div>
          ) : (
            <div style={{ maxHeight: 150, overflowY: 'auto', border: '1px solid var(--border)', borderRadius: 6, padding: 8 }}>
              {tasks.filter(t => t.id !== task.id).map(t => (
                <label key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: 6, cursor: 'pointer', fontSize: 13 }}>
                  <input
                    type="checkbox"
                    checked={task.dependencies?.includes(t.id) || false}
                    onChange={() => toggleDependency(t.id)}
                  />
                  <span>{t.id}: {t.summary}</span>
                </label>
              ))}
            </div>
          )}
          <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 6 }}>
            This task cannot start until selected tasks are completed
          </p>
        </div>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 8 }}>
          <button onClick={onCancel} style={{ background: 'var(--muted)' }}>Cancel</button>
          <button onClick={onSave} className="success">Save Task</button>
        </div>
      </div>
    );
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Critical': return '#dc2626';
      case 'High': return '#f59e0b';
      case 'Medium': return '#3b82f6';
      case 'Low': return '#6b7280';
      default: return '#6b7280';
    }
  };

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h3 style={{ color: 'var(--primary)', fontWeight: 600, margin: 0 }}>
          <span style={{ marginRight: 6 }}>📋</span>Tasks ({tasks.length})
        </h3>
        <button onClick={() => setShowAddModal(true)} className="success">
          + Add Task
        </button>
      </div>

      {tasks.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 48, background: '#f9fafb', borderRadius: 8 }}>
          <p style={{ color: 'var(--muted)', marginBottom: 16 }}>No tasks yet. Add tasks manually or import from CSV.</p>
        </div>
      ) : (
        <div style={{ maxHeight: 500, overflowY: 'auto' }}>
          {tasks.map(task => (
            <div key={task.id} style={{ background: '#f9fafb', borderRadius: 8, padding: 16, marginBottom: 12, border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <span style={{ fontSize: 12, color: 'var(--muted)', fontFamily: 'monospace' }}>{task.id}</span>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 600,
                        padding: '2px 8px',
                        borderRadius: 4,
                        background: getPriorityColor(task.priority),
                        color: '#fff'
                      }}
                      title={`Priority: ${task.priority} - Higher priority tasks are scheduled first`}
                    >
                      {task.priority}
                    </span>
                  </div>
                  <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 4 }}>{task.summary}</div>
                  <div style={{ fontSize: 12, color: 'var(--muted)' }}>
                    Total: {getTotalHours(task.work)} hours
                    {task.dependencies && task.dependencies.length > 0 && (
                      <span style={{ marginLeft: 12 }} title="This task cannot start until its dependencies are completed">
                        🔗 Depends on: {task.dependencies.join(', ')}
                      </span>
                    )}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => setEditingTask(task)} style={{ padding: '6px 12px', fontSize: 13 }}>
                    ✏️ Edit
                  </button>
                  <button onClick={() => deleteTask(task.id)} className="danger" style={{ padding: '6px 12px', fontSize: 13 }}>
                    🗑️
                  </button>
                </div>
              </div>
              
              {/* Work Breakdown Summary */}
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', fontSize: 12 }}>
                {task.work.research > 0 && (
                  <span style={{ background: '#e0e7ff', padding: '4px 8px', borderRadius: 4 }} title="Research phase hours">🔍 {task.work.research}h</span>
                )}
                {task.work.development > 0 && (
                  <span style={{ background: '#dbeafe', padding: '4px 8px', borderRadius: 4 }} title="Development phase hours">💻 {task.work.development}h</span>
                )}
                {task.work.codeReview > 0 && (
                  <span style={{ background: '#fce7f3', padding: '4px 8px', borderRadius: 4 }} title="Code review phase hours - only assigned to reviewers">👀 {task.work.codeReview}h</span>
                )}
                {task.work.reviewFeedback > 0 && (
                  <span style={{ background: '#fef3c7', padding: '4px 8px', borderRadius: 4 }} title="Review feedback phase hours">🔄 {task.work.reviewFeedback}h</span>
                )}
                {task.work.defectCorrection > 0 && (
                  <span style={{ background: '#fee2e2', padding: '4px 8px', borderRadius: 4 }} title="Defect correction phase hours">🐛 {task.work.defectCorrection}h</span>
                )}
                {(task.work.qa || 0) > 0 && (
                  <span style={{ background: '#d1fae5', padding: '4px 8px', borderRadius: 4 }} title="QA phase hours">✅ {task.work.qa}h</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Task Modal */}
      {showAddModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', padding: 32, borderRadius: 12, boxShadow: '0 8px 32px rgba(0,0,0,0.2)', minWidth: 600, maxWidth: 700, maxHeight: '90vh', overflowY: 'auto' }}>
            <h3 style={{ marginBottom: 20, color: 'var(--primary)' }}>➕ Add New Task</h3>
            <TaskForm
              task={newTask}
              setTask={draft => setNewTask(draft)}
              onSave={addTask}
              onCancel={() => { setShowAddModal(false); resetNewTask(); }}
            />
          </div>
        </div>
      )}

      {/* Edit Task Modal */}
      {editingTask && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', padding: 32, borderRadius: 12, boxShadow: '0 8px 32px rgba(0,0,0,0.2)', minWidth: 600, maxWidth: 700, maxHeight: '90vh', overflowY: 'auto' }}>
            <h3 style={{ marginBottom: 20, color: 'var(--primary)' }}>✏️ Edit Task</h3>
            <TaskForm
              task={editingTask}
              setTask={draft => setEditingTask(draft)}
              onSave={updateTask}
              onCancel={() => setEditingTask(null)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
