import fs from 'fs';
import path from 'path';

const TOKEN_FILE = path.join(process.cwd(), 'tokens.json');

export function saveToken(userId: string, tokens: any){
  let store: Record<string, any> = {};
  try{ store = JSON.parse(fs.readFileSync(TOKEN_FILE, 'utf8') || '{}'); }catch(e){}
  store[userId] = tokens;
  fs.writeFileSync(TOKEN_FILE, JSON.stringify(store, null, 2));
}

export function getToken(userId: string){
  try{
    const store = JSON.parse(fs.readFileSync(TOKEN_FILE, 'utf8') || '{}');
    return store[userId];
  }catch(e){ return null; }
}
