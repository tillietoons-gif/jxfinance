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
  mergeClasses,
  tokens,
} from "@fluentui/react-components";

const useStyles = makeStyles({
  body: { padding: 0, overflowY: "auto", width: "100%", minWidth: 0, boxSizing: "border-box" },
  footer: { display: "flex", justifyContent: "flex-end", gap: tokens.spacingHorizontalM, padding: tokens.spacingVerticalL },
  description: { color: tokens.colorNeutralForeground2, lineHeight: tokens.lineHeightBase300 },
});

export function Sheet({ open, onOpenChange, children, size = "large", position = "end", ...props }: { open?: boolean; onOpenChange?: (open: boolean) => void; children: React.ReactNode; size?: "small" | "medium" | "large" | "full"; position?: "start" | "end" | "top" | "bottom" } & Partial<DrawerProps>) {
  const FluentDrawer = Drawer as any;
  return <FluentDrawer open={open} size={size} position={position} onOpenChange={(_, data) => onOpenChange?.(data.open)} {...props}>{children as any}</FluentDrawer>;
}

export function SheetTrigger({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

export function SheetContent({ children, className, side: _side, style, ...props }: any) {
  const styles = useStyles();
  return <DrawerBody className={mergeClasses(styles.body, className)} style={{ width: "100%", maxWidth: "100%", minWidth: 0, boxSizing: "border-box", ...style }} {...props}>{children}</DrawerBody>;
}

export function SheetHeader({ children, className, ...props }: any) { return <DrawerHeader className={className} {...props}>{children}</DrawerHeader>; }
export function SheetTitle({ children, ...props }: any) { return <DrawerHeaderTitle {...props}>{children}</DrawerHeaderTitle>; }
export function SheetFooter({ children, className, ...props }: any) { const styles = useStyles(); return <DrawerFooter className={mergeClasses(styles.footer, className)} {...props}>{children}</DrawerFooter>; }
export function SheetDescription({ children, className, ...props }: any) { const styles = useStyles(); return <p className={mergeClasses(styles.description, className)} {...props}>{children}</p>; }
export function SheetClose({ children = "Close" }: { children?: React.ReactNode }) { return <Button appearance="secondary">{children}</Button>; }
export function SheetPortal({ children }: { children: React.ReactNode }) { return <>{children}</>; }
export function SheetOverlay() { return null; }
