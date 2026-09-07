"use client";

import * as React from "react";
import {
  Button,
  Dialog as FluentDialog,
  DialogActions,
  DialogBody,
  DialogContent as FluentDialogContent,
  DialogSurface,
  DialogTitle as FluentDialogTitle,
  DialogTrigger as FluentDialogTrigger,
  makeStyles,
  mergeClasses,
  tokens,
} from "@fluentui/react-components";

const useStyles = makeStyles({
  surface: {
    width: "min(100% - 2rem, 32rem)",
    maxHeight: "calc(100vh - 2rem)",
    overflowY: "auto",
    padding: tokens.spacingVerticalXXL,
    '@media (max-width: 520px)': {
      width: 'calc(100vw - 2rem)',
      padding: tokens.spacingVerticalL,
    },
  },
  header: { display: "flex", flexDirection: "column", gap: tokens.spacingVerticalXS },
  description: { color: tokens.colorNeutralForeground2, lineHeight: tokens.lineHeightBase300 },
  actions: { display: 'flex', flexWrap: 'wrap', gap: tokens.spacingHorizontalS, justifyContent: 'flex-end', '@media (max-width: 520px)': { flexDirection: 'column-reverse', alignItems: 'stretch' } },
});

type DialogProps = {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
};

export function Dialog({ open, onOpenChange, children }: DialogProps) {
  return (
    <FluentDialog open={open} onOpenChange={(_, data) => onOpenChange?.(data.open)}>
      {children as any}
    </FluentDialog>
  );
}

export function DialogTrigger({ children }: { children: React.ReactNode }) {
  return <FluentDialogTrigger disableButtonEnhancement>{children as any}</FluentDialogTrigger>;
}

export function DialogContent({ children, className, showCloseButton: _showCloseButton, ...props }: any) {
  const styles = useStyles();
  return (
    <DialogSurface className={mergeClasses(styles.surface, className)} {...props}>
      <FluentDialogContent>{children}</FluentDialogContent>
    </DialogSurface>
  );
}

export function DialogHeader({ children, className }: { children: React.ReactNode; className?: string }) {
  const styles = useStyles();
  return <div className={mergeClasses(styles.header, className)}>{children}</div>;
}

export function DialogTitle({ children, ...props }: any) {
  return <FluentDialogTitle {...props}>{children}</FluentDialogTitle>;
}

export function DialogFooter({ children, className, ...props }: any) {
  const styles = useStyles();
  return <DialogActions className={mergeClasses(styles.actions, className)} {...props}>{children}</DialogActions>;
}

export function DialogDescription({ children, className, ...props }: any) {
  const styles = useStyles();
  return <p className={mergeClasses(styles.description, className)} {...props}>{children}</p>;
}

export function DialogClose({ children = "Close" }: { children?: React.ReactNode }) {
  return <FluentDialogTrigger action="close" disableButtonEnhancement><Button appearance="secondary">{children}</Button></FluentDialogTrigger>;
}

export function DialogOverlay() { return null; }
export function DialogPortal({ children }: { children: React.ReactNode }) { return <>{children}</>; }
export { DialogBody };
export { DialogSurface };
