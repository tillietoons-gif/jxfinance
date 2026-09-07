"use client";

import * as React from "react";
import { Tab, TabList, makeStyles, mergeClasses } from "@fluentui/react-components";
const useStyles = makeStyles({ root: { display: "flex", flexDirection: "column", gap: "12px" } });
export function Tabs({ children, defaultValue, value, onValueChange, className }: { children: React.ReactNode; defaultValue?: string; value?: string; onValueChange?: (value: string) => void; className?: string }) { const s = useStyles(); return <div className={mergeClasses(s.root, className)}><div data-tabs-value={value ?? defaultValue} onClick={(e) => { const target = (e.target as HTMLElement).closest("[data-value]"); if (target) onValueChange?.(target.getAttribute("data-value") || ""); }}>{children}</div></div>; }
export function TabsList({ children, className: _className }: { children: React.ReactNode; className?: string }) { return <TabList>{children}</TabList>; }
export function TabsTrigger({ value, children, className: _className }: { value: string; children: React.ReactNode; className?: string }) { return <Tab value={value} data-value={value}>{children}</Tab>; }
export function TabsContent({ value: _value, children, className }: { value: string; children: React.ReactNode; className?: string }) { return <div className={className}>{children}</div>; }
