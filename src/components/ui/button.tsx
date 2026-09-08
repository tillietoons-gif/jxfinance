"use client";

import * as React from "react";
import { Button as FluentButton } from "@fluentui/react-components";

const variantMap = { default: "primary", destructive: "primary", outline: "secondary", secondary: "secondary", ghost: "subtle", link: "subtle" } as const;
const normalizeClassName = (value?: string) => value;

type Props = any;

export function Button({ variant = "default", size = "default", className, asChild: _asChild, style, ...props }: Props) {
  const isIconButton = size === "icon";
  return (
    <FluentButton
      appearance={variantMap[variant as keyof typeof variantMap] || "primary"}
      size={size === "default" ? "medium" : size === "icon" ? "small" : size}
      className={normalizeClassName(className)}
      style={isIconButton ? { width: 32, minWidth: 32, height: 32, padding: 0, flexShrink: 0, ...style } : style}
      {...props}
    />
  );
}

export const buttonVariants = (..._args: any[]) => "";
