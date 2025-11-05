import * as React from 'react';
import { cn } from '@/lib/utils';

export type ButtonVariant = 'default' | 'secondary' | 'destructive' | 'outline' | 'ghost' | 'link';
export type ButtonSize = 'default' | 'sm' | 'lg' | 'icon';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  busy?: boolean;
}

const variantClasses: Record<ButtonVariant, string> = {
  default: 'bg-[#FF3366] text-white hover:bg-[#FF1F55] shadow-sm',
  secondary: 'bg-[#1A1A1A] text-white hover:bg-[#333333] shadow-sm',
  destructive: 'bg-[#FF3366] text-white hover:bg-[#FF1F55] shadow-sm',
  outline: 'border-2 border-[#FF3366] bg-transparent text-[#FF3366] hover:bg-[#FF3366] hover:text-white',
  ghost: 'text-[#1A1A1A] hover:bg-[#F5F5F5] hover:text-[#FF3366]',
  link: 'text-[#FF3366] underline-offset-4 hover:underline hover:text-[#FF1F55]'
};

const sizeClasses: Record<ButtonSize, string> = {
  default: 'h-10 py-2 px-4',
  sm: 'h-9 px-3',
  lg: 'h-11 px-8',
  icon: 'h-10 w-10'
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', busy = false, disabled, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background',
          variantClasses[variant],
            sizeClasses[size],
          className
        )}
        disabled={disabled || busy}
        data-busy={busy || undefined}
        {...props}
      >
        {busy ? (
          <span className="flex items-center gap-2">
            <span className="animate-pulse">•••</span>
            {children && <span className="opacity-70">{children}</span>}
          </span>
        ) : (
          children
        )}
      </button>
    );
  }
);
Button.displayName = 'Button';
