"use client";

import * as React from "react";
import { Button as FluentButton } from "@fluentui/react-components";

const variantMap = { default: "primary", destructive: "primary", outline: "secondary", secondary: "secondary", ghost: "subtle", link: "subtle" } as const;
const normalizeClassName = (value?: string) => value;

type Props = any;

export function Button({ variant = "default", size = "default", className, asChild: _asChild, ...props }: Props) {
  return <FluentButton appearance={variantMap[variant as keyof typeof variantMap] || "primary"} size={size === "default" ? "medium" : size === "icon" ? "small" : size} className={normalizeClassName(className)} {...props} />;
}

export const buttonVariants = (..._args: any[]) => "";
