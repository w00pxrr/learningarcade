"use client";

import React, { useEffect, useRef } from "react";

type DialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
};

type DialogContentProps = {
  className?: string;
  children: React.ReactNode;
};

type DialogHeaderProps = {
  className?: string;
  children: React.ReactNode;
};

type DialogTitleProps = {
  className?: string;
  children: React.ReactNode;
};

type DialogCloseProps = {
  asChild?: boolean;
  children: React.ReactNode;
};

export function Dialog({ open, onOpenChange, children }: DialogProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) {
        onOpenChange(false);
      }
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [open, onOpenChange]);

  if (!open) return null;

  return (
    <div className="dialog-root">
      <div
        ref={overlayRef}
        className="dialog-overlay"
        onClick={() => onOpenChange(false)}
      />
      {children}
    </div>
  );
}

export function DialogContent({
  className = "",
  children,
}: DialogContentProps) {
  return (
    <div className={`dialog-content ${className}`} role="dialog" aria-modal="true">
      {children}
    </div>
  );
}

export function DialogHeader({ className = "", children }: DialogHeaderProps) {
  return <div className={`dialog-header ${className}`}>{children}</div>;
}

export function DialogTitle({ className = "", children }: DialogTitleProps) {
  return <h2 className={`dialog-title ${className}`}>{children}</h2>;
}

export function DialogClose({ asChild, children }: DialogCloseProps) {
  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children as React.ReactElement<{ onClick?: () => void }>, {
      onClick: () => {
        const event = new CustomEvent("dialog-close");
        document.dispatchEvent(event);
      },
    });
  }
  return <button className="btn btn-ghost btn-sm">{children}</button>;
}
