import React from 'react';

export default function PageShell({ children, className = '' }) {
  return <div className={`mx-auto w-full max-w-none ${className}`.trim()}>{children}</div>;
}
