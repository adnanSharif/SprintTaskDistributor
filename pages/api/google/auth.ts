import type { NextApiRequest, NextApiResponse } from 'next';
import { google } from 'googleapis';

export default function handler(req: NextApiRequest, res: NextApiResponse){
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirect = process.env.GOOGLE_REDIRECT_URI || `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/google/callback`;
  if(!clientId || !clientSecret) return res.status(500).json({ error: 'Missing GOOGLE_CLIENT_ID/SECRET in env' });

  const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirect);
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: ['https://www.googleapis.com/auth/spreadsheets'],
    prompt: 'consent'
  });
  res.redirect(authUrl);
}
