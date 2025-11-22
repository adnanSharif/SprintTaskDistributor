'use client';

import React from 'react';
import { scoreRisk, type Task as AssignableTask } from '../lib/assign';

interface RiskMatrixProps {
  tasks: AssignableTask[];
}

export default function RiskMatrix({ tasks }: RiskMatrixProps){
  const scored = tasks.map(t => ({ t, score: scoreRisk(t) }));

  return (
    <div>
      <h3 style={{color:'var(--warning)',fontWeight:600,marginBottom:10}}>
        <span style={{marginRight:6}}>⚠️</span>Risk Assessment
      </h3>
      <p style={{color:'var(--muted)',fontSize:14,marginBottom:12}}>Tasks scored by complexity and risk factors. Higher scores need more attention.</p>
      <div style={{maxHeight:400,overflowY:'auto'}}>
        {scored.length===0 && <p style={{color:'var(--muted)',marginBottom:12}}>No tasks to assess.</p>}
        {scored.map((s,i)=> (
          <div key={i} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:10,borderRadius:8,background:'#f9fafb',marginBottom:8,boxShadow:'0 1px 2px rgba(0,0,0,0.04)'}}>
            <div style={{fontWeight:500,flex:1}}>{s.t.Summary || s.t.summary || s.t.title}</div>
            <div title={s.score>7 ? 'High risk - needs attention' : s.score>4 ? 'Medium risk - monitor closely' : 'Low risk'} style={{fontWeight:700,padding:'6px 14px',borderRadius:20,background:s.score>7?'#fee2e2':s.score>4?'#fef9c3':'#dcfce7',color:s.score>7?'#b91c1c':s.score>4?'#f59e0b':'#16a34a',fontSize:15,minWidth:50,textAlign:'center'}}>{s.score}/10</div>
          </div>
        ))}
      </div>
    </div>
  );
}
