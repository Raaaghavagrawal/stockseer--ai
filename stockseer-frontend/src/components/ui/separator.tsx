

interface SeparatorProps {
  orientation?: 'horizontal' | 'vertical';
  className?: string;
}

export function Separator({ orientation = 'horizontal', className = '' }: SeparatorProps) {
  const baseClasses = 'shrink-0 bg-border';
  const orientationClasses = {
    horizontal: 'h-[1px] w-full',
    vertical: 'h-full w-[1px]'
  };

  return (
    <div className={`${baseClasses} ${orientationClasses[orientation]} ${className}`} />
  );
}
