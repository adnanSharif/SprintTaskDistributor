import { toEstimate, scoreRisk, calculateAssignments } from '../src/lib/assign';

test('toEstimate converts values', ()=>{
  expect(toEstimate({ 'Original Estimate': '8' } as any)).toBe(8);
  expect(toEstimate({ estimate: 3 } as any)).toBe(3);
  expect(toEstimate({} as any)).toBe(0);
});

test('scoreRisk higher for large estimates and bugs', ()=>{
  expect(scoreRisk({ 'Original Estimate': 10 } as any)).toBeGreaterThanOrEqual(5);
  expect(scoreRisk({} as any)).toBeGreaterThanOrEqual(0);
  expect(scoreRisk({ 'Issue Type': 'Bug', 'Original Estimate': 4 } as any)).toBeGreaterThanOrEqual(4);
});

test('assignments assign tasks to members', ()=>{
  const members = [{ name:'A', dailyCapacity:8 }, { name:'B', dailyCapacity:4 }];
  const tasks = [ { Summary:'t1', 'Original Estimate':4 }, {Summary:'t2','Original Estimate':6} ];
  const out = calculateAssignments(members as any, tasks as any);
  expect(out.length).toBe(2);
  // ensure each task has an assignee object present
  expect(out[0].member).toBeDefined();
});
