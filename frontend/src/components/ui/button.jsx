import React from 'react';

const Button = ({ 
  className = '', 
  variant = 'default', 
  size = 'default', 
  children, 
  ...props 
}) => {
  const baseClasses = 'inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50';
  
  const variants = {
    default: 'bg-primary text-primary-foreground hover:bg-primary/90 bg-blue-600 text-white hover:bg-blue-700',
    destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90 bg-red-600 text-white hover:bg-red-700',
    outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground border-gray-300 hover:bg-gray-50',
    secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80 bg-gray-100 text-gray-900 hover:bg-gray-200',
    ghost: 'hover:bg-accent hover:text-accent-foreground hover:bg-gray-100',
    link: 'text-primary underline-offset-4 hover:underline text-blue-600'
  };
  
  const sizes = {
    default: 'h-10 px-4 py-2',
    sm: 'h-9 rounded-md px-3',
    lg: 'h-11 rounded-md px-8',
    icon: 'h-10 w-10'
  };
  
  return (
    <button 
      className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`} 
      {...props}
    >
      {children}
    </button>
  );
};

export { Button };