"use client";

import * as React from "react";
import { Tab, TabList, makeStyles, mergeClasses } from "@fluentui/react-components";
const useStyles = makeStyles({ root: { display: "flex", flexDirection: "column", gap: "12px" } });
const mergeClassName = (base: string, className?: string) => mergeClasses(base, className);
const TabsValueContext = React.createContext<string | undefined>(undefined);

export function Tabs({ children, defaultValue, value, onValueChange, className }: { children: React.ReactNode; defaultValue?: string; value?: string; onValueChange?: (value: string) => void; className?: string }) {
  const s = useStyles();
  const [internalValue, setInternalValue] = React.useState(defaultValue);
  const activeValue = value ?? internalValue;
  const selectValue = (next: string) => { if (value === undefined) setInternalValue(next); onValueChange?.(next); };
  return <TabsValueContext.Provider value={activeValue}><div className={mergeClassName(s.root, className)}><div data-tabs-value={activeValue} onClick={(e) => { const target = (e.target as HTMLElement).closest("[data-value]"); if (target) selectValue(target.getAttribute("data-value") || ""); }}>{children}</div></div></TabsValueContext.Provider>;
}
export function TabsList({ children, className: _className }: { children: React.ReactNode; className?: string }) { return <TabList>{children}</TabList>; }
export function TabsTrigger({ value, children, className: _className }: { value: string; children: React.ReactNode; className?: string }) { return <Tab value={value} data-value={value}>{children}</Tab>; }
export function TabsContent({ value, children, className }: { value: string; children: React.ReactNode; className?: string }) { const activeValue = React.useContext(TabsValueContext); return activeValue === value ? <div className={className}>{children}</div> : null; }
