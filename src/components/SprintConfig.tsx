'use client';

import React from 'react';
import { SprintConfig as SprintConfigType } from '../types/index.d';

interface Props {
  config: SprintConfigType;
  onChange: (config: SprintConfigType) => void;
}

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function SprintConfig({ config, onChange }: Props) {
  const toggleWorkDay = (day: number) => {
    const workDays = config.workDays.includes(day)
      ? config.workDays.filter(d => d !== day)
      : [...config.workDays, day].sort();
    onChange({ ...config, workDays });
  };

  const addHoliday = () => {
    const date = prompt('Enter holiday date (YYYY-MM-DD):');
    if (date && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
      onChange({ ...config, holidays: [...config.holidays, date].sort() });
    }
  };

  const removeHoliday = (date: string) => {
    onChange({ ...config, holidays: config.holidays.filter(h => h !== date) });
  };

  return (
    <div style={{ padding: 24 }}>
      <h3 style={{ color: 'var(--primary)', fontWeight: 600, marginBottom: 16 }}>
        <span style={{ marginRight: 6 }}>📅</span>Sprint Configuration
      </h3>

      {/* Sprint Dates */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
        <div>
          <label style={{ display: 'block', marginBottom: 6, fontWeight: 500, fontSize: 14 }}>
            Sprint Start Date
          </label>
          <input
            type="date"
            value={config.startDate}
            onChange={e => onChange({ ...config, startDate: e.target.value })}
            style={{ width: '100%' }}
            title="First day of the sprint - tasks will be scheduled from this date"
          />
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: 6, fontWeight: 500, fontSize: 14 }}>
            Sprint End Date
          </label>
          <input
            type="date"
            value={config.endDate}
            min={config.startDate}
            onChange={e => onChange({ ...config, endDate: e.target.value })}
            style={{ width: '100%' }}
            title="Last day of the sprint - all tasks should complete by this date"
          />
        </div>
      </div>

      {/* Work Days */}
      <div style={{ marginBottom: 24 }}>
        <label style={{ display: 'block', marginBottom: 10, fontWeight: 500, fontSize: 14 }}>
          Working Days (Default Pattern)
          <span style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 400, marginLeft: 8 }}>
            (Individual developers can override with PTO/custom hours)
          </span>
        </label>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {WEEKDAYS.map((day, idx) => (
            <button
              key={idx}
              onClick={() => toggleWorkDay(idx)}
              style={{
                padding: '8px 16px',
                background: config.workDays.includes(idx) ? 'var(--success)' : '#e5e7eb',
                color: config.workDays.includes(idx) ? '#fff' : '#6b7280',
                border: 'none',
                borderRadius: 6,
                cursor: 'pointer',
                fontWeight: 500,
                fontSize: 13
              }}
            >
              {day.slice(0, 3)}
            </button>
          ))}
        </div>
        <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 8 }}>
          Weekends and holidays can still be overridden per developer
        </p>
      </div>

      {/* Holidays */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <label style={{ fontWeight: 500, fontSize: 14 }}>
            Company Holidays
          </label>
          <button onClick={addHoliday} className="success" style={{ padding: '6px 12px', fontSize: 13 }}>
            + Add Holiday
          </button>
        </div>
        {config.holidays.length === 0 ? (
          <div style={{ fontSize: 13, color: 'var(--muted)', background: '#f9fafb', padding: 16, borderRadius: 6, textAlign: 'center' }}>
            No holidays configured
          </div>
        ) : (
          <div style={{ maxHeight: 150, overflowY: 'auto' }}>
            {config.holidays.map(date => (
              <div key={date} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 10, background: '#f9fafb', borderRadius: 6, marginBottom: 6 }}>
                <span style={{ fontSize: 14 }}>{new Date(date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}</span>
                <button onClick={() => removeHoliday(date)} className="danger" style={{ padding: '4px 8px', fontSize: 12 }}>
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
