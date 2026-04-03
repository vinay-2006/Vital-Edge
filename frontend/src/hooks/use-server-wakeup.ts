import { useEffect, useState } from 'react';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export type ServerStatus = 'checking' | 'online' | 'waking' | 'offline';

export function useServerWakeup() {
  const [serverStatus, setServerStatus] = useState<ServerStatus>('checking');

  useEffect(() => {
    let cancelled = false;
    let attempts = 0;
    const MAX_ATTEMPTS = 12; // 12 × 5s = 60 seconds max wait

    const ping = async () => {
      try {
        await axios.get(`${API_BASE_URL}/health`, { timeout: 8000 });
        if (!cancelled) setServerStatus('online');
      } catch {
        if (!cancelled) {
          attempts += 1;
          if (attempts >= MAX_ATTEMPTS) {
            setServerStatus('offline');
            return;
          }
          setServerStatus('waking');
          setTimeout(ping, 5000);
        }
      }
    };

    ping();
    return () => { cancelled = true; };
  }, []);

  return { serverStatus };
}
