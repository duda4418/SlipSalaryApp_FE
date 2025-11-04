"use client";
import * as React from 'react';
import { cn } from '@/lib/utils';

interface DialogContextValue {
  open: boolean;
  setOpen: (v: boolean) => void;
}
const DialogContext = React.createContext<DialogContextValue | null>(null);
function useDialogCtx() {
  const ctx = React.useContext(DialogContext);
  if (!ctx) throw new Error('Dialog components must be used within <Dialog>');
  return ctx;
}

export interface DialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
}
export function Dialog({ open: controlled, onOpenChange, children }: DialogProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(false);
  const isControlled = controlled !== undefined;
  const open = isControlled ? controlled : uncontrolledOpen;
  const setOpen = (v: boolean) => {
    if (!isControlled) setUncontrolledOpen(v);
    onOpenChange?.(v);
  };
  return <DialogContext.Provider value={{ open, setOpen }}>{children}</DialogContext.Provider>;
}

export interface DialogTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {}
export function DialogTrigger(props: DialogTriggerProps) {
  const { setOpen } = useDialogCtx();
  return <button {...props} onClick={(e) => { props.onClick?.(e); setOpen(true); }} />;
}

export interface DialogOverlayProps extends React.HTMLAttributes<HTMLDivElement> {}
function DialogOverlay({ className, ...props }: DialogOverlayProps) {
  return (
    <div
      className={cn('fixed inset-0 z-40 bg-black/40 backdrop-blur-sm animate-fadeIn', className)}
      {...props}
    />
  );
}

export interface DialogContentProps extends React.HTMLAttributes<HTMLDivElement> {
  onEscapeClose?: boolean;
  onOutsideClose?: boolean;
}
export const DialogContent = React.forwardRef<HTMLDivElement, DialogContentProps>(
  ({ className, onEscapeClose = true, onOutsideClose = true, ...props }, ref) => {
    const { open, setOpen } = useDialogCtx();
    const contentRef = React.useRef<HTMLDivElement | null>(null);
    React.useImperativeHandle(ref, () => contentRef.current as HTMLDivElement);

    React.useEffect(() => {
      if (!open) return;
      function onKey(e: KeyboardEvent) {
        if (e.key === 'Escape' && onEscapeClose) setOpen(false);
      }
      window.addEventListener('keydown', onKey);
      return () => window.removeEventListener('keydown', onKey);
    }, [open, onEscapeClose, setOpen]);

    React.useEffect(() => {
      if (!open || !contentRef.current) return;
      const prev = document.activeElement as HTMLElement | null;
      contentRef.current.focus();
      return () => prev?.focus();
    }, [open]);

    if (!open) return null;
    return (
      <>
        <DialogOverlay onClick={() => onOutsideClose && setOpen(false)} />
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto py-20">
          <div
            role="dialog"
            aria-modal="true"
            ref={contentRef}
            tabIndex={-1}
            className={cn('relative w-full max-w-xl rounded-lg border bg-card text-card-foreground shadow-lg outline-none animate-scaleIn', className)}
            {...props}
          />
        </div>
      </>
    );
  }
);
DialogContent.displayName = 'DialogContent';

export interface DialogHeaderProps extends React.HTMLAttributes<HTMLDivElement> {}
export function DialogHeader({ className, ...props }: DialogHeaderProps) {
  return <div className={cn('flex flex-col space-y-1.5 p-6 border-b', className)} {...props} />;
}

export interface DialogTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {}
export function DialogTitle({ className, ...props }: DialogTitleProps) {
  return <h2 className={cn('text-xl font-semibold tracking-tight', className)} {...props} />;
}

export interface DialogDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {}
export function DialogDescription({ className, ...props }: DialogDescriptionProps) {
  return <p className={cn('text-sm text-muted-foreground', className)} {...props} />;
}

export interface DialogFooterProps extends React.HTMLAttributes<HTMLDivElement> {}
export function DialogFooter({ className, ...props }: DialogFooterProps) {
  return <div className={cn('flex items-center justify-end gap-2 p-6 border-t', className)} {...props} />;
}

export interface DialogCloseProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {}
export function DialogClose({ className, ...props }: DialogCloseProps) {
  const { setOpen } = useDialogCtx();
  return (
    <button
      type="button"
      className={cn('inline-flex h-8 px-3 items-center justify-center rounded-md text-sm font-medium border bg-muted hover:bg-muted/80', className)}
      onClick={(e) => { props.onClick?.(e); setOpen(false); }}
    >
      {props.children || 'Close'}
    </button>
  );
}
