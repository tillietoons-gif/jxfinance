"use client";

import * as React from "react";
import { Card as FluentCard, makeStyles, tokens } from "@fluentui/react-components";

const useStyles = makeStyles({ section: { padding: tokens.spacingVerticalL, display: "flex", flexDirection: "column", gap: tokens.spacingVerticalM }, header: { display: "flex", flexDirection: "column", gap: tokens.spacingVerticalXS }, title: { fontWeight: tokens.fontWeightSemibold, fontSize: tokens.fontSizeBase300 }, content: { paddingTop: tokens.spacingVerticalM }, footer: { display: "flex", alignItems: "center", gap: tokens.spacingHorizontalM, paddingTop: tokens.spacingVerticalM } });
const cx = (base: string, extra?: string) => [base, extra].filter(Boolean).join(" ");
export function Card({ className, ...props }: any) { const s = useStyles(); return <FluentCard className={cx(s.section, className)} {...props} />; }
export function CardHeader({ className, ...props }: React.ComponentProps<"div">) { const s = useStyles(); return <div className={cx(s.header, className)} {...props} />; }
export function CardTitle({ className, ...props }: React.ComponentProps<"div">) { const s = useStyles(); return <div className={cx(s.title, className)} {...props} />; }
export function CardDescription({ className, ...props }: React.ComponentProps<"div">) { return <div className={className} {...props} />; }
export function CardAction({ className, ...props }: React.ComponentProps<"div">) { return <div className={className} {...props} />; }
export function CardContent({ className, ...props }: React.ComponentProps<"div">) { const s = useStyles(); return <div className={cx(s.content, className)} {...props} />; }
export function CardFooter({ className, ...props }: React.ComponentProps<"div">) { const s = useStyles(); return <div className={cx(s.footer, className)} {...props} />; }
