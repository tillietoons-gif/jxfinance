"use client";

import * as React from "react";
import { Input as FluentInput } from "@fluentui/react-components";
export function Input({ className, type, style, ...props }: any) {
  return (
    <FluentInput
      className={className}
      type={type}
      style={{ width: "100%", minWidth: 0, boxSizing: "border-box", ...style }}
      {...props}
    />
  );
}
