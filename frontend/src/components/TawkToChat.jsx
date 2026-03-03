// components/TawkToChat.jsx
import { useEffect, useRef } from 'react';
import { useAuth } from '../auth/AuthContext';

const TawkToChat = () => {
  const { user } = useAuth();
  const scriptLoaded = useRef(false);

  const setUserAttributes = () => {
    if (!window.Tawk_API) return;

    if (user) {
      const name = user.firstName && user.lastName
        ? `${user.firstName} ${user.lastName}`
        : user.email || 'Visiteur';
      window.Tawk_API.setAttributes({
        name,
        email: user.email || '',
        role: user.role || '',
      });
    } else {
      window.Tawk_API.setAttributes({ name: '', email: '' });
    }
  };

  useEffect(() => {
    if (scriptLoaded.current) return;
    scriptLoaded.current = true;

    const script = document.createElement('script');
    script.async = true;
    script.src = 'https://embed.tawk.to/69a46c1b1e8d121c31776c12/1jil4cj1m';
    script.charset = 'UTF-8';
    script.setAttribute('crossorigin', '*');
    document.body.appendChild(script);

    const handleTawkLoad = () => setUserAttributes();
    window.addEventListener('tawkLoad', handleTawkLoad);

    if (window.Tawk_API) setUserAttributes();

    return () => {
      window.removeEventListener('tawkLoad', handleTawkLoad);
    };
  }, []);

  useEffect(() => {
    setUserAttributes();
  }, [user]);

  return null;
};

export default TawkToChat;