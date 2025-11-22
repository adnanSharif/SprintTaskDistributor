'use client';

import React, { useEffect, useCallback, useRef, useState } from 'react';
import useLocalStorage from '../hooks/useLocalStorage';
import { Developer } from '../types/index.d';

export default function TeamRoster({ team, setTeam }: { team: Developer[]; setTeam: (t: Developer[]) => void }) {
  const [stored, setStored] = useLocalStorage<Developer[]>('std.team', []);
  const lastTeamRef = useRef<Developer[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [newMember, setNewMember] = useState<Partial<Developer>>({ name: '', role: 'Dev', dailyCapacity: 8, canReview: true });

  // Sync from parent team when CSV import happens
  useEffect(() => {
    if (team && team.length > 0 && JSON.stringify(team) !== JSON.stringify(lastTeamRef.current)) {
      const isExternalUpdate = JSON.stringify(team) !== JSON.stringify(stored);
      if (isExternalUpdate) {
        setStored(prev => {
          const merged = [...(prev || [])];
          team.forEach(csvMember => {
            const exists = merged.some(m => m.name === csvMember.name);
            if (!exists) {
              merged.push({ ...csvMember, id: csvMember.id || `dev-${Date.now()}-${Math.random()}`, canReview: csvMember.canReview ?? true });
            }
          });
          return merged;
        });
      }
    }
  }, [team, stored, setStored]);

  // Push stored roster back to parent
  useEffect(() => {
    lastTeamRef.current = stored || [];
    setTeam(stored || []);
  }, [stored, setTeam]);

  const onChange = useCallback(<K extends keyof Developer>(idx: number, key: K, value: Developer[K]) => {
    setStored(prev => {
      const copy = [...(prev || [])];
      copy[idx] = { ...copy[idx], [key]: value };
      return copy;
    });
  }, [setStored]);

  const handleAddMember = useCallback(() => {
    setStored(prev => {
      const copy = [...(prev || [])];
      copy.push({
        id: `dev-${Date.now()}`,
        name: newMember.name || 'Unnamed',
        role: 'Dev' as const,
        dailyCapacity: newMember.dailyCapacity || 8,
        canReview: newMember.canReview ?? true
      });
      return copy;
    });
    setModalOpen(false);
    setNewMember({ name: '', role: 'Dev', dailyCapacity: 8, canReview: true });
  }, [setStored, newMember]);

  const removeMember = useCallback((idx: number) => {
    setStored(prev => {
      const copy = [...(prev || [])];
      copy.splice(idx, 1);
      return copy;
    });
  }, [setStored]);

  return (
    <div style={{ padding: 24 }}>
      <h3 style={{ color: 'var(--primary)', fontWeight: 600, marginBottom: 16 }}>
        <span style={{ marginRight: 6 }}>👥</span>Team Roster <span style={{ fontSize: 13, color: 'var(--muted)' }}>({stored.length} members)</span>
      </h3>
      <div style={{ maxHeight: 400, overflowY: 'auto', marginBottom: 16 }}>
        {(!stored || stored.length === 0) && (
          <div style={{ textAlign: 'center', padding: '32px 16px', background: '#f9fafb', borderRadius: 8, marginBottom: 16 }}>
            <p style={{ color: 'var(--muted)', marginBottom: 0 }}>No team members yet. Click &quot;Add Member&quot; or import CSV.</p>
          </div>
        )}
        {(stored || []).map((m, i) => (
          <div key={m.id || i} style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 12, padding: 14, borderRadius: 8, background: '#f9fafb', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', border: '1px solid var(--border)' }}>
            <input value={m.name || ''} onChange={e => onChange(i, 'name', e.target.value)} placeholder="Name" style={{ flex: 1 }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'white', padding: '4px 8px', borderRadius: 6 }}>
              <input
                style={{ width: 60, background: 'transparent', border: 'none' }}
                value={m.dailyCapacity || 8}
                onChange={e => onChange(i, 'dailyCapacity', Number(e.target.value))}
                type="number"
                min={1}
                max={24}
                title="Daily capacity in hours"
              />
              <span style={{ fontSize: 13, color: 'var(--muted)', whiteSpace: 'nowrap' }}>hrs/day</span>
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 13 }} title="Can perform code reviews for other developers">
              <input
                type="checkbox"
                checked={m.canReview ?? true}
                onChange={e => onChange(i, 'canReview', e.target.checked)}
              />
              <span>👀 Reviewer</span>
            </label>
            <button className="danger" title="Remove member" onClick={() => removeMember(i)} style={{ padding: '8px 12px' }}>🗑️</button>
          </div>
        ))}
      </div>
      <div>
        <button onClick={() => setModalOpen(true)} className="success" title="Add new team member" style={{ width: '100%' }}>
          ➕ Add Member
        </button>
      </div>
      {modalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', padding: 32, borderRadius: 12, boxShadow: '0 8px 32px rgba(0,0,0,0.2)', minWidth: 380, maxWidth: 500 }}>
            <h3 style={{ marginBottom: 20, color: 'var(--primary)' }}>➕ Add Team Member</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ display: 'block', marginBottom: 6, fontWeight: 500 }}>Name</label>
                <input
                  value={newMember.name || ''}
                  onChange={e => setNewMember(n => ({ ...n, name: e.target.value }))}
                  placeholder="Enter member name"
                  style={{ width: '100%' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 6, fontWeight: 500 }}>Daily Capacity (hours/day)</label>
                <input
                  type="number"
                  min={1}
                  max={24}
                  value={newMember.dailyCapacity || 8}
                  onChange={e => setNewMember(n => ({ ...n, dailyCapacity: Number(e.target.value) }))}
                  placeholder="8"
                  style={{ width: '100%' }}
                />
                <p style={{ fontSize: 13, color: 'var(--muted)', marginTop: 4 }}>
                  Total sprint capacity = daily capacity × working days
                </p>
              </div>
              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={newMember.canReview ?? true}
                    onChange={e => setNewMember(n => ({ ...n, canReview: e.target.checked }))}
                  />
                  <span style={{ fontWeight: 500 }}>Can perform code reviews</span>
                </label>
                <p style={{ fontSize: 13, color: 'var(--muted)', marginTop: 4 }}>
                  Only experienced developers should review others&rsquo; code
                </p>
              </div>
            </div>
            <div style={{ marginTop: 24, display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button onClick={() => setModalOpen(false)} style={{ background: 'var(--muted)' }}>Cancel</button>
              <button onClick={handleAddMember} className="success">Add Member</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
