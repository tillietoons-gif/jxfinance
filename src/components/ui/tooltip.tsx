"use client"

import * as React from "react"
import { Tooltip as FluentTooltip, makeStyles, tokens } from "@fluentui/react-components"

const useStyles = makeStyles({ content: { maxWidth: "min(90vw, 24rem)", padding: tokens.spacingVerticalS } })
export function TooltipProvider({ children, delayDuration: _delayDuration }: { children: React.ReactNode; delayDuration?: number }) { return <>{children}</> }
export function Tooltip({ children, open, defaultOpen, onOpenChange, ...props }: any) { return <FluentTooltip relationship="description" content={null} open={open} defaultOpen={defaultOpen} onOpenChange={(_, data) => onOpenChange?.(data.open)} {...props}>{children}</FluentTooltip> }
export function TooltipTrigger({ children, asChild: _asChild, ...props }: any) { return <span {...props}>{children as any}</span> }
export function TooltipContent({ children, className: _className, ...props }: any) { const styles = useStyles(); return <span className={styles.content} {...props}>{children}</span> }

