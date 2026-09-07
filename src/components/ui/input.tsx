"use client";

import * as React from "react";
import { Input as FluentInput } from "@fluentui/react-components";
export function Input({ className, type, ...props }: any) { return <FluentInput className={className} type={type} {...props} />; }
