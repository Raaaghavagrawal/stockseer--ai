import React, { useState, useRef, useEffect } from 'react';

interface DropdownMenuProps {
  children: React.ReactNode;
  trigger: React.ReactNode;
  className?: string;
  align?: 'left' | 'right' | 'center';
  side?: 'top' | 'bottom';
}

interface DropdownMenuItemProps {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
}

interface DropdownMenuContentProps {
  children: React.ReactNode;
  className?: string;
}

interface DropdownMenuTriggerProps {
  children: React.ReactNode;
  className?: string;
}

export function DropdownMenu({ 
  children, 
  trigger, 
  className = '', 
  align = 'left',
  side = 'bottom'
}: DropdownMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleTriggerClick = () => {
    setIsOpen(!isOpen);
  };

  const getAlignmentClasses = () => {
    switch (align) {
      case 'right':
        return 'right-0';
      case 'center':
        return 'left-1/2 transform -translate-x-1/2';
      default:
        return 'left-0';
    }
  };

  const getSideClasses = () => {
    switch (side) {
      case 'top':
        return 'bottom-full mb-2';
      default:
        return 'top-full mt-2';
    }
  };

  return (
    <div ref={dropdownRef} className={`relative inline-block ${className}`}>
      <div onClick={handleTriggerClick} className="cursor-pointer">
        {trigger}
      </div>
      
      {isOpen && (
        <div
          className={`absolute z-50 min-w-[200px] ${getAlignmentClasses()} ${getSideClasses()}`}
        >
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg py-2 animate-in fade-in-0 zoom-in-95 duration-200">
            {children}
          </div>
        </div>
      )}
    </div>
  );
}

export function DropdownMenuTrigger({ children, className = '' }: DropdownMenuTriggerProps) {
  return (
    <div className={className}>
      {children}
    </div>
  );
}

export function DropdownMenuContent({ children, className = '' }: DropdownMenuContentProps) {
  return (
    <div className={className}>
      {children}
    </div>
  );
}

export function DropdownMenuItem({ 
  children, 
  onClick, 
  className = '', 
  disabled = false 
}: DropdownMenuItemProps) {
  const handleClick = () => {
    if (!disabled && onClick) {
      onClick();
    }
  };

  // Check if children contains a Link component
  const hasLink = React.Children.toArray(children).some(
    child => React.isValidElement(child) && 
    typeof child.type === 'function' && 
    (child.type as any)?.displayName === 'Link'
  );

  return (
    <div
      onClick={hasLink ? undefined : handleClick}
      className={`
        px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-300 
        hover:bg-gray-100 dark:hover:bg-gray-700 
        transition-colors duration-200
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        ${!hasLink ? 'cursor-pointer' : ''}
        ${className}
      `}
    >
      {children}
    </div>
  );
}

export function DropdownMenuSeparator() {
  return (
    <div className="h-px bg-gray-200 dark:bg-gray-700 my-1" />
  );
}
