'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { calculateAssignments, toEstimate } from '../lib/assign';
import { 
  DndContext, 
  DragEndEvent, 
  DragOverlay, 
  closestCenter, 
  PointerSensor, 
  useSensor, 
  useSensors,
  useDroppable,
  DragStartEvent
} from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import useLocalStorage from '../hooks/useLocalStorage';
import { exportToCSV } from '../lib/csv';

type Props = { team:any[]; tasks:any[]; setTasks:(t:any[])=>void };

// Droppable container component
function DroppableContainer({ id, children }: { id: string; children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id });
  
  return (
    <div 
      ref={setNodeRef} 
      style={{
        minHeight: 120,
        backgroundColor: isOver ? '#f0f9ff' : 'transparent',
        transition: 'background-color 0.2s',
        borderRadius: 6,
        padding: 4,
      }}
    >
      {children}
    </div>
  );
}

// Sortable task item component
function SortableTaskItem({ id, task, assigned, team, taskKey, onManualAssign }: any) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    padding: 8,
    marginBottom: 8,
    background: '#fff',
    borderRadius: 6,
    boxShadow: '0 1px 2px rgba(0,0,0,0.06)',
    cursor: 'grab',
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <div style={{fontSize:14}}>{task.Summary || task.summary || task.title}</div>
        <div style={{fontSize:12,color:'#666'}}>{toEstimate(task)}</div>
      </div>
      {onManualAssign && (
        <div style={{marginTop:6,display:'flex',gap:6,alignItems:'center'}} onClick={(e) => e.stopPropagation()}>
          <select 
            value={assigned[taskKey] ?? ''} 
            onChange={e=>onManualAssign(taskKey, e.target.value === '' ? null : Number(e.target.value))}
            onPointerDown={(e) => e.stopPropagation()}
          >
            <option value="">(unassigned)</option>
            {team.map((tm: any, i2: number)=> <option key={i2} value={i2}>{tm.name}</option>)}
          </select>
        </div>
      )}
    </div>
  );
}

export default function AssignmentBoard({ team, tasks, setTasks }: Props){
  const [activeId, setActiveId] = useState<string | null>(null);
  const [sprintDays, setSprintDays] = useState(10); // Default sprint length
  // assigned: map of taskKey -> memberIndex | null (null means backlog)
  const [assigned, setAssigned] = useLocalStorage<Record<string, number|null>>('std.assignments', {});

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  // Utility to create stable task key
  const taskKey = (task:any, idx:number) => (task.id ?? task['Issue key'] ?? task.key ?? `t-${idx}`);

  // initialize suggestions if no assignments exist
  useEffect(()=>{
    if(Object.keys(assigned || {}).length === 0 && tasks.length>0 && team.length>0){
      const suggestions = calculateAssignments(team, tasks, sprintDays);
      const map: Record<string, number|null> = {};
      suggestions.forEach((s,i)=>{
        const key = taskKey(s.task, i);
        const memberIndex = team.findIndex(m=>m.name === s.member?.name);
        map[key] = memberIndex>=0 ? memberIndex : null;
      });
      setAssigned(map);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tasks, team, sprintDays]);

  // Build lists for DnD rendering
  const backlogList = useMemo(()=>{
    return tasks.map((t,i)=>({ key: taskKey(t,i), task: t, index: i })).filter(x=> (assigned[x.key] ?? null) === null);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tasks, assigned]);

  const membersWithTasks = useMemo(()=>{
    return team.map((m,mi)=>({ member: m, index: mi, tasks: tasks.map((t,i)=>({ key: taskKey(t,i), task:t, index:i })).filter(x=> assigned[x.key]===mi) }));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [team, tasks, assigned]);

  const onDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  }

  const onDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    
    if (!over) return;
    
    const taskKeyStr = active.id as string;
    const overId = over.id as string;
    
    const newAssigned = { ...(assigned || {}) };
    
    if (overId === 'backlog') {
      newAssigned[taskKeyStr] = null;
    } else if (overId.startsWith('member-')) {
      const mi = Number(overId.replace('member-', ''));
      newAssigned[taskKeyStr] = mi;
    }
    
    setAssigned(newAssigned);
  }

  const manualAssign = (taskKeyStr:string, memberIndex:number|null) => {
    const newAssigned = { ...(assigned || {}) };
    newAssigned[taskKeyStr] = memberIndex;
    setAssigned(newAssigned);
  }

  const buildPlanRows = () => {
    const rows: any[] = [];
    tasks.forEach((t,i)=>{
      const key = taskKey(t,i);
      const assignee = assigned[key] != null ? team[assigned[key] as number]?.name : '';
      rows.push({ Task: t.Summary || t.summary || t.title || `Task ${i+1}`, Estimate: toEstimate(t as any), Assignee: assignee });
    });
    return rows;
  }

  const handleExportCSV = () => {
    const rows = buildPlanRows();
    exportToCSV(rows, 'sprint-plan.csv');
  }

  const pushToSheets = async () => {
    const rows = buildPlanRows();
    try{
      const res = await fetch('/api/google/push', { method:'POST', headers: { 'content-type':'application/json' }, body: JSON.stringify({ rows }) });
      const j = await res.json();
      if(!res.ok) throw new Error(j.error || 'push failed');
      alert('Pushed plan to Google Sheets');
    }catch(err:any){
      alert('Sheets push failed: ' + (err.message||err));
    }
  }

  return (
    <div>
      <h3>Task Assignment Board</h3>
      <div style={{marginBottom:18,display:'flex',alignItems:'center',gap:18}}>
        <span style={{color:'var(--muted)',fontSize:15}}>Sprint Length:</span>
        <input type="number" min={1} max={30} value={sprintDays} onChange={e=>setSprintDays(Number(e.target.value))} style={{width:60}} />
        <span style={{color:'var(--muted)',fontSize:15}}>days</span>
        <span style={{color:'var(--primary)',fontWeight:500}}>Each member’s total capacity = daily capacity × sprint days</span>
      </div>
      <p style={{color:'var(--muted)',fontSize:14,marginBottom:18}}>
        <b>How it works:</b> Tasks are distributed to team members based on their available sprint capacity. You can drag tasks or use dropdowns to manually override assignments. <span style={{color:'var(--primary)',fontWeight:500}}>Task distribution is the main focus of this app.</span>
      </p>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
      >
        <div style={{display:'flex',gap:24,alignItems:'flex-start',flexWrap:'wrap'}}>
          {/* Backlog Column */}
          <div style={{width:340,minWidth:260}} className="card">
            <h4 style={{color:'var(--primary)',fontWeight:600,marginBottom:10}}>
              <span style={{marginRight:6}}>🗂️</span>Backlog <span style={{fontSize:13,color:'var(--muted)'}}>({backlogList.length})</span>
            </h4>
            <DroppableContainer id="backlog">
              <SortableContext items={backlogList.map(x => x.key)} strategy={verticalListSortingStrategy}>
                {backlogList.length === 0 && <div style={{color:'var(--muted)',padding:16,textAlign:'center'}}>All tasks assigned!</div>}
                {backlogList.map((item)=> (
                  <SortableTaskItem
                    key={item.key}
                    id={item.key}
                    task={item.task}
                    assigned={assigned}
                    team={team}
                    taskKey={item.key}
                    onManualAssign={null}
                  />
                ))}
              </SortableContext>
            </DroppableContainer>
          </div>
          {/* Team Columns */}
          <div style={{flex:1,display:'flex',gap:16,overflowX:'auto'}}>
            {team.map((m, mi)=> (
              <div key={mi} className="card" style={{minWidth:220,background:'#f8fafc'}}>
                <h4 style={{color:'var(--success)',fontWeight:600,marginBottom:10}}>
                  <span style={{marginRight:6}}>👤</span>{m.name || `Member ${mi+1}`}
                </h4>
                <DroppableContainer id={`member-${mi}`}>
                  <SortableContext 
                    items={membersWithTasks[mi]?.tasks.map((x: any) => x.key) || []} 
                    strategy={verticalListSortingStrategy}
                  >
                    {membersWithTasks[mi]?.tasks.length === 0 && <div style={{color:'var(--muted)',padding:12,textAlign:'center'}}>No tasks assigned</div>}
                    {membersWithTasks[mi]?.tasks.map((it: any)=> (
                      <SortableTaskItem
                        key={it.key}
                        id={it.key}
                        task={it.task}
                        assigned={assigned}
                        team={team}
                        taskKey={it.key}
                        onManualAssign={manualAssign}
                      />
                    ))}
                  </SortableContext>
                </DroppableContainer>
              </div>
            ))}
          </div>
        </div>
        <DragOverlay>
          {activeId ? (
            <div style={{padding:12,background:'#fff',borderRadius:8,boxShadow:'var(--shadow)',opacity:0.95,minWidth:180}}>
              <div style={{fontSize:15,fontWeight:500}}>Dragging task...</div>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
      <div style={{marginTop:20,display:'flex',gap:12}}>
        <button onClick={handleExportCSV} className="success">⬇️ Download CSV</button>
        <button onClick={pushToSheets} className="accent">📤 Push to Google Sheets</button>
        <button onClick={()=>{ if(typeof window !== 'undefined'){ localStorage.removeItem('std.assignments'); } setAssigned({}); }} className="danger">🗑️ Reset Assignments</button>
      </div>
    </div>
  );
}
