"use client";
import React from 'react';
import { clsx } from 'clsx';

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  error?: string;
};

export const Input: React.FC<InputProps> = ({ label, error, className, ...rest }) => {
  return (
    <label className="flex flex-col gap-1 text-sm">
  {label && <span className="font-medium text-[--color-primary]">{label}</span>}
      <input
        className={clsx(
          'rounded-[--radius-sm] border border-[--color-border] bg-[--color-surface] px-3 py-2 shadow-sm placeholder:text-[--neutral-600] focus:border-[--color-accent] focus:outline-none focus-ring',
          error && 'border-[--color-danger] focus:border-[--color-danger] focus:ring-transparent',
          className
        )}
        {...rest}
      />
  {error && <span className="text-xs text-[--color-danger]">{error}</span>}
    </label>
  );
};
