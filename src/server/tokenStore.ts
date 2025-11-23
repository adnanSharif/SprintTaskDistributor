import fs from 'fs';
import path from 'path';
import { Credentials } from 'google-auth-library';

const TOKEN_FILE = path.join(process.cwd(), 'tokens.json');

function readStore(): Record<string, Credentials> {
  try {
    const content = fs.readFileSync(TOKEN_FILE, 'utf8');
    return content ? JSON.parse(content) : {};
  } catch {
    return {};
  }
}

export function saveToken(userId: string, tokens: Credentials){
  const store = readStore();
  store[userId] = tokens;
  fs.writeFileSync(TOKEN_FILE, JSON.stringify(store, null, 2));
}

export function getToken(userId: string): Credentials | null {
  const store = readStore();
  return store[userId] ?? null;
}
