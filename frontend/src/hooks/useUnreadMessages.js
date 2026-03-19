import { useEffect, useState } from 'react';
import { useAuth } from '../auth/AuthContext';

export function useUnreadMessages(pollMs = 15000) {
  const { token } = useAuth();
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!token) return undefined;
    let cancelled = false;

    const fetchCount = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/messages/unread/count', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) return;
        const data = await response.json();
        if (!cancelled) setCount(data?.data?.count || 0);
      } catch {
        if (!cancelled) setCount(0);
      }
    };

    fetchCount();
    const id = setInterval(fetchCount, pollMs);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [token, pollMs]);

  return count;
}
