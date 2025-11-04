"use client";
import React from 'react';
import { clsx } from 'clsx';

type Variant = 'primary' | 'secondary' | 'danger' | 'outline' | 'accent' | 'ghost';

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  busy?: boolean;
};

const variantClasses: Record<Variant, string> = {
  primary: 'bg-[--color-primary] text-white hover:bg-[--color-primary-600] focus-ring',
  secondary: 'bg-[--neutral-700] text-white hover:bg-[--neutral-800] focus-ring',
  danger: 'bg-[--color-danger] text-white hover:bg-[--color-danger-600] focus-ring',
  accent: 'bg-[--color-accent] text-white hover:bg-[--color-accent-600] focus-ring',
  outline: 'border border-[--color-border] text-[--neutral-700] hover:border-[--color-primary] hover:text-[--color-primary] focus-ring',
  ghost: 'text-[--neutral-700] hover:bg-[--neutral-100] focus-ring',
};

export const Button: React.FC<ButtonProps> = ({ variant = 'primary', className, busy, children, disabled, ...rest }) => {
  return (
    <button
      className={clsx(
  'inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus-ring select-none active:scale-[.98]',
        variantClasses[variant],
        className
      )}
      disabled={disabled || busy}
      {...rest}
    >
      {busy && (
        <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
      )}
      {children}
    </button>
  );
};
