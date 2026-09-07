"use client"

import * as React from "react"
import { Popover as FluentPopover, PopoverSurface, PopoverTrigger as FluentPopoverTrigger, makeStyles, tokens } from "@fluentui/react-components"

const useStyles = makeStyles({ surface: { padding: tokens.spacingVerticalM, maxWidth: "min(90vw, 28rem)", maxHeight: "min(70vh, 32rem)", overflow: "auto" } })

export function Popover({ children, open, onOpenChange, ...props }: any) { return <FluentPopover open={open} onOpenChange={(_, data) => onOpenChange?.(data.open)} {...props}>{children}</FluentPopover> }
export function PopoverTrigger({ children, asChild: _asChild, ...props }: any) { return <FluentPopoverTrigger {...props}>{children as any}</FluentPopoverTrigger> }
export function PopoverContent({ children, className: _className, ...props }: any) { const styles = useStyles(); return <PopoverSurface className={styles.surface} {...props}>{children}</PopoverSurface> }
export function PopoverAnchor({ children, ...props }: any) { return <span {...props}>{children}</span> }

