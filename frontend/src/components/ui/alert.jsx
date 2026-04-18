import React from 'react';

const Alert = ({ className = '', children, ...props }) => (
  <div 
    className={`relative w-full rounded-lg border p-4 [&>svg~*]:pl-7 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground border-gray-200 bg-gray-50 ${className}`} 
    {...props}
  >
    {children}
  </div>
);

const AlertDescription = ({ className = '', children, ...props }) => (
  <div className={`text-sm [&_p]:leading-relaxed text-gray-700 ${className}`} {...props}>
    {children}
  </div>
);

export { Alert, AlertDescription };