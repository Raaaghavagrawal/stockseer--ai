import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'secondary' | 'destructive' | 'outline';
  className?: string;
}

export function Badge({ children, variant = 'default', className = '' }: BadgeProps) {
  const baseClasses = 'inline-flex items-center rounded-full border px-3 py-1 text-xs font-bold transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 hover:scale-105';
  
  const variantClasses = {
    default: 'border-transparent bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-md',
    secondary: 'border-transparent bg-gradient-to-r from-gray-500 to-gray-600 text-white shadow-md',
    destructive: 'border-transparent bg-gradient-to-r from-red-500 to-pink-600 text-white shadow-md',
    outline: 'border-2 border-blue-500 text-blue-500 bg-transparent hover:bg-blue-500 hover:text-white'
  };

  return (
    <div className={`${baseClasses} ${variantClasses[variant]} ${className}`}>
      {children}
    </div>
  );
}
