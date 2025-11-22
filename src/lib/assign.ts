/**
 * Assignment and risk scoring logic.
 * Keep this module small and well-tested so Copilot can extend it.
 */

export type Member = { id?: string; name?: string; dailyCapacity?: number };
export type Task = { Summary?: string; estimate?: number; 'Original Estimate'?: number } & Record<string, any>;

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
  if(task['Issue Type'] && String(task['Issue Type']).toLowerCase().includes('bug')) score += 2;
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
