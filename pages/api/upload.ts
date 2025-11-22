import type { NextApiRequest, NextApiResponse } from 'next';
import Papa from 'papaparse';

// Minimal API to accept CSV uploads as raw text body
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();
  const csvInput = typeof req.body === 'string' ? req.body : req.body?.csv;
  if (!csvInput || typeof csvInput !== 'string') {
    return res.status(400).json({ error: 'Missing csv in body' });
  }

  try {
    const parsed = Papa.parse(csvInput, { header: true, skipEmptyLines: true });
    return res.status(200).json({ rows: parsed.data });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'parse error';
    return res.status(500).json({ error: message });
  }
}
