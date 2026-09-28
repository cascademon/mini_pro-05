import { useEffect, useState } from 'react';

// Keys belong to this mounted screen only, never to browser storage.
export function useEphemeralApiKey() {
  const [apiKey, setApiKey] = useState('');
  useEffect(() => {
    try {
      window.localStorage.removeItem('openaiApiKey');
    } catch {
      // Storage can be disabled; the in-memory input still works.
    }
  }, []);
  return [apiKey, setApiKey];
}
