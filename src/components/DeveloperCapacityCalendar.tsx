'use client';

import React, { useState } from 'react';
import { Developer } from '../types/index.d';

interface Props {
  developers: Developer[];
  sprintStart: string;
  sprintEnd: string;
  workDays: number[];
  holidays: string[];
  onChange: (developers: Developer[]) => void;
}

export default function DeveloperCapacityCalendar({ developers, sprintStart, sprintEnd, workDays, holidays, onChange }: Props) {
  const [selectedDev, setSelectedDev] = useState<string>(developers[0]?.id || '');
  const [viewMode, setViewMode] = useState<'pto' | 'custom'>('pto');

  const getDatesInRange = () => {
    const dates: Date[] = [];
    const start = new Date(sprintStart + 'T00:00:00');
    const end = new Date(sprintEnd + 'T00:00:00');
    
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      dates.push(new Date(d));
    }
    return dates;
  };

  const formatDate = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  const togglePTO = (devId: string, date: string) => {
    const dev = developers.find(d => d.id === devId);
    if (!dev) return;

    const ptoDates = dev.ptoDates || [];
    const newPtoDates = ptoDates.includes(date)
      ? ptoDates.filter(d => d !== date)
      : [...ptoDates, date];

    onChange(developers.map(d => d.id === devId ? { ...d, ptoDates: newPtoDates } : d));
  };

  const setCustomCapacity = (devId: string, date: string, hours: number) => {
    const dev = developers.find(d => d.id === devId);
    if (!dev) return;

    const customCapacity = { ...(dev.customCapacity || {}) };
    if (hours === dev.dailyCapacity) {
      delete customCapacity[date]; // Remove if same as default
    } else {
      customCapacity[date] = hours;
    }

    onChange(developers.map(d => d.id === devId ? { ...d, customCapacity } : d));
  };

  const getCapacityForDate = (dev: Developer, date: string, dayOfWeek: number) => {
    // Check PTO
    if (dev.ptoDates?.includes(date)) return 0;
    
    // Check custom capacity
    if (dev.customCapacity?.[date] !== undefined) return dev.customCapacity[date];
    
    // Check holidays
    if (holidays.includes(date)) return 0;
    
    // Check work days
    if (!workDays.includes(dayOfWeek)) return 0;
    
    return dev.dailyCapacity;
  };

  const dates = getDatesInRange();
  const currentDev = developers.find(d => d.id === selectedDev);

  if (developers.length === 0) {
    return (
      <div style={{ padding: 24 }}>
        <h3 style={{ color: 'var(--primary)', fontWeight: 600, marginBottom: 16 }}>
          <span style={{ marginRight: 6 }}>🗓️</span>Developer Capacity Calendar
        </h3>
        <div style={{ fontSize: 13, color: 'var(--muted)', background: '#f9fafb', padding: 16, borderRadius: 6, textAlign: 'center' }}>
          Add team members to configure individual capacity
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: 24 }}>
      <h3 style={{ color: 'var(--primary)', fontWeight: 600, marginBottom: 16 }}>
        <span style={{ marginRight: 6 }}>🗓️</span>Developer Capacity Calendar
      </h3>

      {/* Developer Selector */}
      <div style={{ marginBottom: 16 }}>
        <label style={{ display: 'block', marginBottom: 6, fontWeight: 500, fontSize: 14 }}>
          Select Developer
        </label>
        <select
          value={selectedDev}
          onChange={e => setSelectedDev(e.target.value)}
          style={{ width: '100%', padding: 10 }}
        >
          {developers.map(dev => (
            <option key={dev.id} value={dev.id}>
              {dev.name} (Default: {dev.dailyCapacity}h/day)
            </option>
          ))}
        </select>
      </div>

      {/* View Mode Toggle */}
      <div style={{ marginBottom: 16, display: 'flex', gap: 8 }}>
        <button
          onClick={() => setViewMode('pto')}
          style={{
            flex: 1,
            padding: '8px 16px',
            background: viewMode === 'pto' ? 'var(--primary)' : '#e5e7eb',
            color: viewMode === 'pto' ? '#fff' : '#6b7280',
            border: 'none',
            borderRadius: 6,
            cursor: 'pointer',
            fontWeight: 500
          }}
        >
          🏖️ PTO Days
        </button>
        <button
          onClick={() => setViewMode('custom')}
          style={{
            flex: 1,
            padding: '8px 16px',
            background: viewMode === 'custom' ? 'var(--primary)' : '#e5e7eb',
            color: viewMode === 'custom' ? '#fff' : '#6b7280',
            border: 'none',
            borderRadius: 6,
            cursor: 'pointer',
            fontWeight: 500
          }}
        >
          ⚙️ Custom Hours
        </button>
      </div>

      {/* Calendar Grid */}
      <div style={{ maxHeight: 400, overflowY: 'auto', border: '1px solid var(--border)', borderRadius: 8, background: '#fff' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead style={{ background: '#f9fafb', position: 'sticky', top: 0, zIndex: 1 }}>
            <tr>
              <th style={{ padding: 10, textAlign: 'left', fontSize: 13, fontWeight: 600, borderBottom: '1px solid var(--border)' }}>Date</th>
              <th style={{ padding: 10, textAlign: 'left', fontSize: 13, fontWeight: 600, borderBottom: '1px solid var(--border)' }}>Day</th>
              <th style={{ padding: 10, textAlign: 'center', fontSize: 13, fontWeight: 600, borderBottom: '1px solid var(--border)' }}>
                {viewMode === 'pto' ? 'PTO' : 'Hours'}
              </th>
            </tr>
          </thead>
          <tbody>
            {dates.map(date => {
              const dateStr = formatDate(date);
              const dayOfWeek = date.getDay();
              const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
              const capacity = currentDev ? getCapacityForDate(currentDev, dateStr, dayOfWeek) : 0;
              const isPTO = currentDev?.ptoDates?.includes(dateStr);
              const isHoliday = holidays.includes(dateStr);
              const isWeekend = !workDays.includes(dayOfWeek);

              return (
                <tr key={dateStr} style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <td style={{ padding: 10, fontSize: 13 }}>
                    {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </td>
                  <td style={{ padding: 10, fontSize: 13, color: isWeekend ? 'var(--muted)' : 'inherit' }}>
                    {dayName}
                    {isHoliday && <span style={{ marginLeft: 6, fontSize: 11, color: '#dc2626' }}>🎉 Holiday</span>}
                  </td>
                  <td style={{ padding: 10, textAlign: 'center' }}>
                    {viewMode === 'pto' ? (
                      <button
                        onClick={() => togglePTO(selectedDev, dateStr)}
                        style={{
                          padding: '6px 16px',
                          background: isPTO ? '#dc2626' : (capacity === 0 ? '#e5e7eb' : '#16a34a'),
                          color: (isPTO || capacity > 0) ? '#fff' : '#6b7280',
                          border: 'none',
                          borderRadius: 4,
                          cursor: 'pointer',
                          fontSize: 12,
                          fontWeight: 500
                        }}
                      >
                        {isPTO ? 'PTO' : capacity === 0 ? 'Off' : `${capacity}h`}
                      </button>
                    ) : (
                      <input
                        type="number"
                        min={0}
                        max={24}
                        step={0.5}
                        value={currentDev?.customCapacity?.[dateStr] ?? capacity}
                        onChange={e => setCustomCapacity(selectedDev, dateStr, Number(e.target.value))}
                        style={{
                          width: 70,
                          padding: '6px 8px',
                          textAlign: 'center',
                          border: '1px solid var(--border)',
                          borderRadius: 4
                        }}
                      />
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div style={{ marginTop: 12, fontSize: 12, color: 'var(--muted)', background: '#f9fafb', padding: 12, borderRadius: 6 }}>
        💡 <strong>Tip:</strong> Use PTO mode for full days off, or Custom Hours mode to set specific capacity (e.g., 4h for half-day, 2h for meetings).
      </div>
    </div>
  );
}
