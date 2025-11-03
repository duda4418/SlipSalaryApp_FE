import React from 'react';

export const Spinner: React.FC<{ size?: number; className?: string }> = ({ size = 24, className }) => (
  <span
    className={"inline-block animate-spin rounded-full border-2 border-[#192B37] border-t-transparent " + (className || '')}
    style={{ width: size, height: size }}
  />
);
