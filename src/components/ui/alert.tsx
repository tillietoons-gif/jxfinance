"use client"

import * as React from "react"
import { MessageBar, MessageBarBody, MessageBarTitle } from "@fluentui/react-components"

export function Alert({ variant = "default", children, ...props }: any) { return <MessageBar intent={variant === "destructive" ? "error" : "info"} {...props}><MessageBarBody>{children}</MessageBarBody></MessageBar> }
export function AlertTitle({ children, ...props }: any) { return <MessageBarTitle {...props}>{children}</MessageBarTitle> }
export function AlertDescription({ children, ...props }: any) { return <div {...props}>{children}</div> }

