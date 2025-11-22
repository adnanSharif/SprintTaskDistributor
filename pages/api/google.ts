import type { NextApiRequest, NextApiResponse } from 'next';
// Placeholder for Google Sheets oauth integration
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.status(200).json({ message: 'Google API integration endpoint (stub). Configure OAuth credentials in .env' });
}
