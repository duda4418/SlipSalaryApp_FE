import React from 'react';
import { clsx } from 'clsx';

export const Card: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, children, ...rest }) => {
  return (
    <div
      className={clsx('rounded-[--radius-lg] border border-[--color-border] bg-[--color-surface] p-5 shadow-sm transition-all hover:shadow-md hover:bg-[--color-surface-alt]', className)}
      {...rest}
    >
      {children}
    </div>
  );
};

export const CardTitle: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({ className, children, ...rest }) => (
  <h2 className={clsx('mb-2 text-lg font-semibold tracking-tight text-[--color-primary]', className)} {...rest}>{children}</h2>
);

export const CardFooter: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, children, ...rest }) => (
  <div className={clsx('mt-4 flex items-center justify-end gap-2', className)} {...rest}>{children}</div>
);
