'use client';

import React from 'react';
import type { Task as AssignableTask } from '../lib/assign';

interface BacklogProps {
  tasks: AssignableTask[];
  setTasks: (tasks: AssignableTask[]) => void;
}

export default function Backlog({ tasks, setTasks }: BacklogProps){
  const onEdit = (idx:number, key:'Summary' | 'Original Estimate', value:string | number)=>{
    setTasks(tasks.map((task, taskIdx) => (
      taskIdx === idx ? ({ ...task, [key]: value }) : task
    )));
  };

  return (
    <div>
      <h3 style={{color:'var(--primary)',fontWeight:600,marginBottom:10}}>
        <span style={{marginRight:6}}>📋</span>Task Backlog <span style={{fontSize:13,color:'var(--muted)'}}>({tasks.length} tasks)</span>
      </h3>
      {tasks.length===0 && <p style={{color:'var(--muted)',marginBottom:12}}>No tasks imported yet. Upload a CSV to get started.</p>}
      <div style={{maxHeight:400,overflowY:'auto'}}>
        {tasks.map((t, i)=> (
          <div key={i} style={{display:'flex',gap:10,alignItems:'center',padding:10,borderRadius:8,background:'#f9fafb',marginBottom:8,boxShadow:'0 1px 2px rgba(0,0,0,0.04)'}}>
            <input style={{flex:1}} value={t['Summary']||t.summary||t.title||''} onChange={e=>onEdit(i,'Summary',e.target.value)} placeholder="Task summary" />
            <div style={{display:'flex',alignItems:'center',gap:6}}>
              <input style={{width:70}} value={t['Original Estimate']||t.estimate||t.est||0} onChange={e=>onEdit(i,'Original Estimate', Number(e.target.value))} placeholder="Hrs" />
              <span style={{fontSize:13,color:'var(--muted)'}}>hrs</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
