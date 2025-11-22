import type { NextApiRequest, NextApiResponse } from 'next';
import { google } from 'googleapis';
import { saveToken } from '../../../src/server/tokenStore';

export default async function handler(req: NextApiRequest, res: NextApiResponse){
  const code = req.query.code as string;
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirect = process.env.GOOGLE_REDIRECT_URI || `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/google/callback`;
  if(!code) return res.status(400).send('Missing code');
  if(!clientId || !clientSecret) return res.status(500).send('Missing GOOGLE_CLIENT_ID/SECRET in env');

  const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirect);
  try{
    const { tokens } = await oauth2Client.getToken(code);
    // Save tokens to dev token store for later use
    saveToken('default', tokens);
    res.status(200).send('Authentication successful — you can return to the app. Tokens saved (dev store).');
  }catch(err:any){
    res.status(500).send('Token exchange failed: ' + (err.message||err));
  }
}
