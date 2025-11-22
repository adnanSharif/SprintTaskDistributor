'use client';

import React, { useRef } from 'react';
import { parseTasksCSV, parseTeamCSV } from '../lib/csv';

type Props = { onImport: (data: { tasks?: any[]; team?: any[] }) => void };

// CSV importer with improved format detection
export default function UploadCSV({ onImport }: Props) {
  const ref = useRef<HTMLInputElement | null>(null);

  const handleFile = (f: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (!text) return;

      try {
        // Detect if it's tasks or team CSV based on headers
        const firstLine = text.split('\n')[0].toLowerCase();
        
        if (firstLine.includes('research hours') || 
            firstLine.includes('development hours') || 
            firstLine.includes('issue key') || 
            firstLine.includes('summary')) {
          // Tasks CSV
          const tasks = parseTasksCSV(text);
          onImport({ tasks });
        } else if (firstLine.includes('daily capacity') || 
                   firstLine.includes('capacity') || 
                   firstLine.includes('role')) {
          // Team CSV
          const team = parseTeamCSV(text);
          onImport({ team });
        } else {
          alert('Could not detect CSV format. Please ensure headers match the expected format.');
        }
      } catch (error) {
        console.error('CSV parse error:', error);
        alert('Error parsing CSV file. Please check the format.');
      }
    };
    reader.readAsText(f);
  };

  return (
    <div
      style={{
        textAlign: 'center',
        padding: '32px 24px',
        border: '2px dashed var(--border)',
        borderRadius: 12,
        background: '#fafafa',
        cursor: 'pointer'
      }}
      onClick={() => ref.current?.click()}
    >
      <div style={{ fontSize: '3rem', marginBottom: 12 }}>📁</div>
      <h4 style={{ marginBottom: 8, color: 'var(--accent)' }}>Import CSV</h4>
      <p style={{ color: 'var(--muted)', fontSize: 14, marginBottom: 12 }}>
        Tasks or Team roster
      </p>
      <input
        ref={ref}
        type="file"
        accept=".csv,text/csv"
        onChange={(e) => {
          if (e.target.files && e.target.files[0]) handleFile(e.target.files[0]);
        }}
        style={{ display: 'none' }}
      />
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          ref.current?.click();
        }}
        style={{ fontSize: 14 }}
      >
        Choose File
      </button>
    </div>
  );
}
