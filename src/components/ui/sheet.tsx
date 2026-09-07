"use client";

import * as React from "react";
import {
  Button,
  Drawer,
  DrawerBody,
  DrawerFooter,
  DrawerHeader,
  DrawerHeaderTitle,
  DrawerProps,
  makeStyles,
  tokens,
} from "@fluentui/react-components";

const useStyles = makeStyles({
  body: { padding: tokens.spacingVerticalL, overflowY: "auto" },
  footer: { display: "flex", justifyContent: "flex-end", gap: tokens.spacingHorizontalM, padding: tokens.spacingVerticalL },
  description: { color: tokens.colorNeutralForeground2, lineHeight: tokens.lineHeightBase300 },
});

export function Sheet({ open, onOpenChange, children, ...props }: { open?: boolean; onOpenChange?: (open: boolean) => void; children: React.ReactNode } & Partial<DrawerProps>) {
  const FluentDrawer = Drawer as any;
  return <FluentDrawer open={open} onOpenChange={(_, data) => onOpenChange?.(data.open)} {...props}>{children as any}</FluentDrawer>;
}

export function SheetTrigger({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

export function SheetContent({ children, className, side: _side, ...props }: any) {
  const styles = useStyles();
  return <DrawerBody className={`${styles.body}${className ? ` ${className}` : ""}`} {...props}>{children}</DrawerBody>;
}

export function SheetHeader({ children, className, ...props }: any) { return <DrawerHeader className={className} {...props}>{children}</DrawerHeader>; }
export function SheetTitle({ children, ...props }: any) { return <DrawerHeaderTitle {...props}>{children}</DrawerHeaderTitle>; }
export function SheetFooter({ children, className, ...props }: any) { const styles = useStyles(); return <DrawerFooter className={`${styles.footer}${className ? ` ${className}` : ""}`} {...props}>{children}</DrawerFooter>; }
export function SheetDescription({ children, className, ...props }: any) { const styles = useStyles(); return <p className={`${styles.description}${className ? ` ${className}` : ""}`} {...props}>{children}</p>; }
export function SheetClose({ children = "Close" }: { children?: React.ReactNode }) { return <Button appearance="secondary">{children}</Button>; }
export function SheetPortal({ children }: { children: React.ReactNode }) { return <>{children}</>; }
export function SheetOverlay() { return null; }
