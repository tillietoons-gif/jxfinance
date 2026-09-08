"use client"

import * as React from "react"

type SelectContextValue = {
  value?: string
  onValueChange?: (value: string) => void
  disabled?: boolean
  items: Array<{ value: string; label: string; disabled?: boolean }>
}

const SelectContext = React.createContext<SelectContextValue | null>(null)

function collectItems(node: React.ReactNode, items: SelectContextValue["items"] = []) {
  React.Children.forEach(node, (child) => {
    if (!React.isValidElement(child)) return
    if (child.type === SelectItem) {
      const props = child.props as { value: string; disabled?: boolean; children?: React.ReactNode }
      items.push({ value: props.value, disabled: props.disabled, label: String(props.children ?? props.value) })
      return
    }
    collectItems((child.props as { children?: React.ReactNode }).children, items)
  })
  return items
}

function Select({ children, value, defaultValue, onValueChange, disabled, ...props }: React.ComponentProps<"div"> & {
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
  disabled?: boolean
}) {
  const items = React.useMemo(() => collectItems(children), [children])
  const [internalValue, setInternalValue] = React.useState(defaultValue ?? value ?? "")
  const activeValue = value ?? internalValue
  const change = (next: string) => {
    if (value === undefined) setInternalValue(next)
    onValueChange?.(next)
  }
  return <SelectContext.Provider value={{ value: activeValue, onValueChange: change, disabled, items }}><div {...props}>{children}</div></SelectContext.Provider>
}

function SelectGroup({ children }: { children?: React.ReactNode }) { return <>{children}</> }
function SelectValue({ placeholder }: { placeholder?: string }) {
  const context = React.useContext(SelectContext)
  const item = context?.items.find((entry) => entry.value === context.value)
  return <>{item?.label ?? placeholder}</>
}

function SelectTrigger({ className, size = "default", children, ...props }: React.ComponentProps<"select"> & { size?: "sm" | "default" }) {
  const context = React.useContext(SelectContext)
  return <select {...props} value={context?.value ?? ""} disabled={props.disabled ?? context?.disabled} onChange={(event) => context?.onValueChange?.(event.target.value)} className={className} aria-label={props["aria-label"] ?? "Select option"} style={{ width: "100%", minHeight: size === "sm" ? 32 : 36, padding: "0 12px", borderRadius: 6, border: "1px solid var(--colorNeutralStroke1, #d1d1d1)", background: "var(--colorNeutralBackground1, #fff)", color: "var(--colorNeutralForeground1, #242424)", ...props.style }}>{!context?.value && <option value="">{(React.Children.toArray(children).find((child) => React.isValidElement(child)) as React.ReactElement<{ placeholder?: string }> | undefined)?.props.placeholder ?? "Select option"}</option>}{context?.items.map((item) => <option key={item.value} value={item.value} disabled={item.disabled}>{item.label}</option>)}</select>
}

function SelectContent({ children: _children }: { children?: React.ReactNode }) { return null }
function SelectLabel({ children }: { children?: React.ReactNode }) { return <>{children}</> }
function SelectItem({ value, children, disabled }: { value: string; children?: React.ReactNode; disabled?: boolean }) { return <option value={value} disabled={disabled}>{children}</option> }
function SelectSeparator() { return null }
function SelectScrollUpButton() { return null }
function SelectScrollDownButton() { return null }

export { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectScrollDownButton, SelectScrollUpButton, SelectSeparator, SelectTrigger, SelectValue }
