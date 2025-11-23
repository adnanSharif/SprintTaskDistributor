/**
 * Assignment and risk scoring logic.
 * Keep this module small and well-tested so Copilot can extend it.
 */

import type { Task as SprintTask, Developer } from '../types/index.d';

type LegacyTaskFields = {
  Summary?: string;
  summary?: string;
  title?: string;
  estimate?: number;
  est?: number;
  Estimate?: number;
  'Original Estimate'?: number;
  'Issue Type'?: string;
};

export type Member = Pick<Developer, 'id' | 'name' | 'dailyCapacity'>;
export type Task = SprintTask & LegacyTaskFields;

export function toEstimate(t: Task){
  const raw = t['Original Estimate'] ?? t.estimate ?? t.Estimate ?? t.est ?? 0;
  const n = Number(raw);
  return Number.isFinite(n) ? n : 0;
}

export function scoreRisk(task: Task){
  // Simple heuristic risk scoring: larger estimates + missing fields increase risk
  const est = toEstimate(task);
  let score = Math.min(10, Math.round(est / 2));
  if(!task['Summary'] && !task.summary && !task.title) score += 3;
  const issueType = task['Issue Type'];
  if(typeof issueType === 'string' && issueType.toLowerCase().includes('bug')) score += 2;
  return Math.min(10, score);
}

export function calculateAssignments(members: Member[], tasks: Task[], sprintDays: number = 10){
  // Calculate total sprint capacity for each member
  const mems = members.map(m => ({ ...m, remaining: (m.dailyCapacity ?? 8) * sprintDays }));
  const out: { member?: Member; task: Task; estimate:number }[] = [];

  for(const t of tasks){
    const est = toEstimate(t);
    // Pick member with most remaining capacity
    mems.sort((a,b)=> (b.remaining ?? 0) - (a.remaining ?? 0));
    const pick = mems.find(m => (m.remaining ?? 0) >= est) || mems[0];
    if(pick) pick.remaining = (pick.remaining ?? 0) - est;
    out.push({ member: pick, task: t, estimate: est });
  }

  return out;
}
