import type { NextApiRequest, NextApiResponse } from 'next';
import Papa from 'papaparse';

// Minimal API to accept CSV uploads as raw text body
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();
  const csv = req.body.csv || req.body;
  if (!csv) return res.status(400).json({ error: 'Missing csv in body' });

  try {
    const parsed = Papa.parse(csv, { header: true, skipEmptyLines: true });
    return res.status(200).json({ rows: parsed.data });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'parse error' });
  }
}
