"use client";

import * as React from "react";
import { Drawer, DrawerBody, DrawerHeader, DrawerHeaderTitle, Button } from "@fluentui/react-components";
export function Sheet({ open, onOpenChange, children }: { open?: boolean; onOpenChange?: (open: boolean) => void; children: React.ReactNode }) { return <Drawer open={open} onOpenChange={(_, data) => onOpenChange?.(data.open)}>{children}</Drawer>; }
export function SheetTrigger({ children }: { children: React.ReactNode }) { return <>{children}</>; }
export function SheetContent({ children, side: _side, className: _className, ...props }: any) { return <DrawerBody {...props}>{children}</DrawerBody>; }
export function SheetHeader({ children, className: _className, ...props }: any) { return <DrawerHeader {...props}>{children}</DrawerHeader>; }
export function SheetTitle({ children, className: _className, ...props }: any) { return <DrawerHeaderTitle {...props}>{children}</DrawerHeaderTitle>; }
export function SheetFooter({ children }: { children: React.ReactNode }) { return <div>{children}</div>; }
export function SheetDescription({ children }: { children: React.ReactNode }) { return <p>{children}</p>; }
export function SheetClose() { return <Button appearance="secondary">Close</Button>; }
export function SheetPortal({ children }: { children: React.ReactNode }) { return <>{children}</>; }
export function SheetOverlay() { return null; }
