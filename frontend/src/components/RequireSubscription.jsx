import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { getMySubscription } from '../auth/api';
import { Loader2 } from 'lucide-react';

export default function RequireSubscription({ children }) {
  const { token } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [loading, setLoading] = useState(true);
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    if (!token) return;

    let isMounted = true;
    const check = async () => {
      setLoading(true);
      setAllowed(false); // always reset before checking
      try {
        const res = await getMySubscription({ token });
        const sub = res?.data || { plan: 'FREE', status: 'INACTIVE' };
        const ok = sub.plan !== 'FREE' && sub.status === 'ACTIVE';
        if (isMounted) {
          setAllowed(ok);
          setLoading(false);
          if (!ok) {
            navigate('/artisan/subscription', { state: { from: location.pathname } });
          }
        }
      } catch (error) {
        console.error('Subscription validation failed', error);
        if (isMounted) {
          setAllowed(false);
          setLoading(false);
          navigate('/artisan/subscription', { state: { from: location.pathname } });
        }
      }
    };

    check();

    return () => { isMounted = false; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, location.pathname]);

  if (loading) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (!allowed) return null;

  return <>{children}</>;
}
