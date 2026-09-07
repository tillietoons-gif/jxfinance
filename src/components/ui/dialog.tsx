"use client";

import * as React from "react";
import { Dialog as FluentDialog, DialogSurface, DialogTitle as FluentDialogTitle, DialogBody, DialogActions, Button } from "@fluentui/react-components";
export function Dialog({ open, onOpenChange, children }: { open?: boolean; onOpenChange?: (open: boolean) => void; children: React.ReactNode }) { return <FluentDialog open={open} onOpenChange={(_, data) => onOpenChange?.(data.open)}>{children as any}</FluentDialog>; }
export function DialogTrigger({ children }: { children: React.ReactNode }) { return <>{children}</>; }
export function DialogContent({ children, className: _className, ...props }: React.ComponentProps<typeof DialogSurface> & { showCloseButton?: boolean }) { return <DialogSurface {...props}><DialogBody>{children}</DialogBody></DialogSurface>; }
export function DialogHeader({ children, className: _className }: { children: React.ReactNode; className?: string }) { return <div>{children}</div>; }
export function DialogTitle({ children, className: _className, ...props }: any) { return <FluentDialogTitle {...props}>{children}</FluentDialogTitle>; }
export function DialogFooter({ children, className: _className, ...props }: any) { return <DialogActions {...props}>{children}</DialogActions>; }
export function DialogDescription({ children, className: _className, ...props }: any) { return <p {...props}>{children}</p>; }
export function DialogClose() { return <Button appearance="secondary">Close</Button>; }
export function DialogOverlay() { return null; }
export function DialogPortal({ children }: { children: React.ReactNode }) { return <>{children}</>; }
