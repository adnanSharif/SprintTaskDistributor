import type { NextApiRequest, NextApiResponse } from 'next';
import { google } from 'googleapis';
import { getToken } from '../../../src/server/tokenStore';

interface SheetRow {
  Task?: string;
  Estimate?: string | number;
  Assignee?: string;
}

function isSheetRowArray(value: unknown): value is SheetRow[] {
  return Array.isArray(value) && value.every(row => typeof row === 'object' && row !== null);
}

export default async function handler(req: NextApiRequest, res: NextApiResponse){
  if(req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
  const rowsInput = req.body?.rows;
  if(!isSheetRowArray(rowsInput)) return res.status(400).json({ error: 'Missing rows' });
  const rows = rowsInput;

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirect = process.env.GOOGLE_REDIRECT_URI || `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/google/callback`;
  const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID;
  if(!clientId || !clientSecret) return res.status(500).json({ error: 'Missing GOOGLE_CLIENT_ID/SECRET in env' });
  if(!spreadsheetId) return res.status(500).json({ error: 'Missing GOOGLE_SPREADSHEET_ID in env' });

  const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirect);
  const tokens = getToken('default');
  if(!tokens) return res.status(400).json({ error: 'No stored tokens. Authenticate first via /api/google/auth' });
  oauth2Client.setCredentials(tokens);

  try{
    const sheets = google.sheets({ version: 'v4', auth: oauth2Client });
    const values = rows.map(r => [r.Task ?? '', r.Estimate ?? '', r.Assignee ?? '']);
    // write to sheet starting at A1; this is a simple append/overwrite flow
    await sheets.spreadsheets.values.append({ spreadsheetId, range: 'Sheet1!A1', valueInputOption: 'RAW', requestBody: { values } });
    res.status(200).json({ ok: true });
  }catch(err){
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: message });
  }
}
