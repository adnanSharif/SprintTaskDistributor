import { useEffect, useState } from 'react';

export default function useLocalStorage<T>(key: string, initial: T){
  const [state, setState] = useState<T>(() => {
    try{
      if(typeof window === 'undefined') return initial;
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) as T : initial;
    }catch(e){
      return initial;
    }
  });

  useEffect(()=>{
    try{
      if(typeof window === 'undefined') return;
      localStorage.setItem(key, JSON.stringify(state));
    }catch(e){/* ignore */}
  }, [key, state]);

  return [state, setState] as const;
}
