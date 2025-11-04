import * as React from 'react';
import { cn } from '@/lib/utils';

export interface SpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: 'sm' | 'md' | 'lg';
}

const sizeMap: Record<NonNullable<SpinnerProps['size']>, string> = {
  sm: 'h-4 w-4 border-2',
  md: 'h-6 w-6 border-2',
  lg: 'h-8 w-8 border-3'
};

export const Spinner: React.FC<SpinnerProps> = ({ className, size = 'md', ...props }) => (
  <div
    aria-live="polite"
    aria-busy="true"
    role="status"
    className={cn('inline-flex items-center justify-center', className)}
    {...props}
  >
    <div className={cn('animate-spin rounded-full border-muted border-t-transparent', sizeMap[size])} />
    <span className="sr-only">Loading</span>
  </div>
);
