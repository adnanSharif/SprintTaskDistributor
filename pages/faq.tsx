'use client';

import React from 'react';

const faqs = [
  {
    q: 'How is team capacity calculated?',
    a: 'Capacity is declared per member as daily working hours (default: 8 hours/day). Total sprint capacity is calculated as daily capacity × sprint days (default: 10 days). You can adjust daily capacity for each member in the Team Roster.'
  },
  {
    q: 'Is capacity in days or hours?',
    a: 'Capacity is in hours. Each member’s daily capacity is multiplied by the number of sprint days to get total available hours.'
  },
  {
    q: 'How do I add team members?',
    a: 'Click the “Add Member” button in the Team Roster section. A modal will open for you to enter member details. All team info is stored in your browser (localStorage) and persists across sessions.'
  },
  {
    q: 'How does task assignment work?',
    a: 'Tasks are distributed based on available capacity. The algorithm assigns tasks to team members so that no one is overloaded. You can manually override assignments by dragging tasks or using dropdowns.'
  },
  {
    q: 'How do I import tasks and team info?',
    a: 'Use the Import CSV section to upload a JIRA-compatible CSV. The app will split team and task rows automatically.'
  },
  {
    q: 'Where is my data stored?',
    a: 'All data (team, tasks, assignments) is stored in your browser using localStorage. No data is sent to a server unless you use the Google Sheets export.'
  },
  {
    q: 'How do I export the plan?',
    a: 'Use the “Download CSV” button to export the current assignment plan. You can also push the plan to Google Sheets if configured.'
  },
  {
    q: 'Can I adjust capacity for PTO or holidays?',
    a: 'Currently, you can manually adjust daily capacity for each member. PTO/holiday support is planned for future releases.'
  },
  {
    q: 'Why is task assignment not working as expected?',
    a: 'Check that team members have enough capacity and tasks have valid estimates. You can manually reassign tasks if needed.'
  }
];

export default function FAQPage() {
  return (
    <div className="container card" style={{maxWidth:700,marginTop:40}}>
      <h2 style={{color:'var(--primary)',marginBottom:24}}>FAQ: Sprint Task Distributor</h2>
      <div>
        {faqs.map((f, i) => (
          <div key={i} style={{marginBottom:24}}>
            <div style={{fontWeight:600,fontSize:18,color:'var(--accent)',marginBottom:6}}>{f.q}</div>
            <div style={{color:'var(--muted)',fontSize:15}}>{f.a}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
