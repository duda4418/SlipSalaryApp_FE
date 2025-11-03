import React from 'react';

export const Table: React.FC<React.TableHTMLAttributes<HTMLTableElement>> = ({ className, children, ...rest }) => (
  <div className="overflow-x-auto">
    <table className={"w-full border-collapse text-sm " + (className || '')} {...rest}>{children}</table>
  </div>
);

export const THead: React.FC<React.HTMLAttributes<HTMLTableSectionElement>> = ({ children, ...rest }) => (
  <thead {...rest} className="bg-[--neutral-100] text-[--color-primary]">{children}</thead>
);
export const TBody: React.FC<React.HTMLAttributes<HTMLTableSectionElement>> = ({ children, ...rest }) => (
  <tbody {...rest}>{children}</tbody>
);
export const TR: React.FC<React.HTMLAttributes<HTMLTableRowElement>> = ({ children, className, ...rest }) => (
  <tr className={"border-b border-[--color-border] last:border-b-0 " + (className || '')} {...rest}>{children}</tr>
);
export const TH: React.FC<React.ThHTMLAttributes<HTMLTableCellElement>> = ({ children, className, ...rest }) => (
  <th className={"px-3 py-2 text-left font-medium " + (className || '')} {...rest}>{children}</th>
);
export const TD: React.FC<React.TdHTMLAttributes<HTMLTableCellElement>> = ({ children, className, ...rest }) => (
  <td className={"px-3 py-2 " + (className || '')} {...rest}>{children}</td>
);
