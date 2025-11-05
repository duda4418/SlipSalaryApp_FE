import * as React from 'react';
import { cn } from '@/lib/utils';

export interface TableProps extends React.TableHTMLAttributes<HTMLTableElement> {}
export const Table = React.forwardRef<HTMLTableElement, TableProps>(
  ({ className, ...props }, ref) => (
    <div className="relative w-full overflow-auto">
      <table
        ref={ref}
        className={cn('w-full caption-bottom text-sm bg-white rounded-lg overflow-hidden', className)}
        {...props}
      />
    </div>
  )
);
Table.displayName = 'Table';

export interface THeadProps extends React.HTMLAttributes<HTMLTableSectionElement> {}
export const THead = React.forwardRef<HTMLTableSectionElement, THeadProps>(
  ({ className, ...props }, ref) => (
    <thead
      ref={ref}
      className={cn('[&_tr]:border-b border-[#EEEEEE] bg-[#FAFAFA] font-medium text-[#1A1A1A]', className)}
      {...props}
    />
  )
);
THead.displayName = 'THead';

export interface TBodyProps extends React.HTMLAttributes<HTMLTableSectionElement> {}
export const TBody = React.forwardRef<HTMLTableSectionElement, TBodyProps>(
  ({ className, ...props }, ref) => (
    <tbody
      ref={ref}
      className={cn('[&_tr:last-child]:border-0', className)}
      {...props}
    />
  )
);
TBody.displayName = 'TBody';

export interface TRProps extends React.HTMLAttributes<HTMLTableRowElement> {}
export const TR = React.forwardRef<HTMLTableRowElement, TRProps>(
  ({ className, ...props }, ref) => (
    <tr
      ref={ref}
      className={cn('border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted', className)}
      {...props}
    />
  )
);
TR.displayName = 'TR';

export interface THProps extends React.ThHTMLAttributes<HTMLTableCellElement> {}
export const TH = React.forwardRef<HTMLTableCellElement, THProps>(
  ({ className, ...props }, ref) => (
    <th
      ref={ref}
      className={cn('h-10 px-2 text-left align-middle font-medium text-muted-foreground', className)}
      {...props}
    />
  )
);
TH.displayName = 'TH';

export interface TDProps extends React.TdHTMLAttributes<HTMLTableCellElement> {}
export const TD = React.forwardRef<HTMLTableCellElement, TDProps>(
  ({ className, ...props }, ref) => (
    <td
      ref={ref}
      className={cn('p-2 align-middle', className)}
      {...props}
    />
  )
);
TD.displayName = 'TD';
