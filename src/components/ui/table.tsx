"use client";

import * as React from "react";
import { Table as FluentTable, TableHeader as FluentTableHeader, TableBody as FluentTableBody, TableRow as FluentTableRow, TableCell as FluentTableCell, TableHeaderCell } from "@fluentui/react-components";
export function Table({ className, style, ...props }: React.ComponentProps<typeof FluentTable>) { return <div role="region" aria-label="Scrollable table" tabIndex={0} style={{ overflowX: "auto", maxWidth: "100%" }}><FluentTable className={className} style={{ minWidth: "max-content", ...style }} {...props} /></div>; }
export function TableHeader(props: React.ComponentProps<typeof FluentTableHeader>) { return <FluentTableHeader {...props} />; }
export function TableBody(props: React.ComponentProps<typeof FluentTableBody>) { return <FluentTableBody {...props} />; }
export function TableRow(props: React.ComponentProps<typeof FluentTableRow>) { return <FluentTableRow {...props} />; }
export function TableHead(props: React.ComponentProps<typeof TableHeaderCell>) { return <TableHeaderCell {...props} />; }
export function TableCell({ className, style, ...props }: React.ComponentProps<typeof FluentTableCell>) { return <FluentTableCell className={className} style={{ verticalAlign: "middle", ...style }} {...props} />; }
export function TableFooter(props: React.ComponentProps<"tfoot">) { return <tfoot {...props} />; }
export function TableCaption(props: React.ComponentProps<"caption">) { return <caption {...props} />; }
