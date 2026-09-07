"use client"

import * as React from "react"
import { Menu, MenuButton, MenuDivider, MenuGroup, MenuItem, MenuList, MenuPopover, MenuTrigger } from "@fluentui/react-components"

export function DropdownMenu({ children, open, onOpenChange, ...props }: any) { return <Menu open={open} onOpenChange={(_, data) => onOpenChange?.(data.open)} {...props}>{children}</Menu> }
export function DropdownMenuPortal({ children }: any) { return <>{children}</> }
export function DropdownMenuTrigger({ children, asChild: _asChild, ...props }: any) { return <MenuTrigger disableButtonEnhancement {...props}>{children as any}</MenuTrigger> }
export function DropdownMenuContent({ children, ...props }: any) { return <MenuPopover {...props}><MenuList>{children}</MenuList></MenuPopover> }
export function DropdownMenuGroup({ children, ...props }: any) { return <MenuGroup {...props}>{children}</MenuGroup> }
export function DropdownMenuItem({ children, onSelect, onClick, disabled, ...props }: any) { return <MenuItem disabled={disabled} onClick={(event) => { onClick?.(event); onSelect?.(event) }} {...props}>{children}</MenuItem> }
export function DropdownMenuCheckboxItem({ children, checked, onCheckedChange, ...props }: any) { return <MenuItem role="menuitemcheckbox" aria-checked={checked} onClick={() => onCheckedChange?.(!checked)} {...props}>{children}</MenuItem> }
export function DropdownMenuRadioGroup({ children, ...props }: any) { return <div role="group" {...props}>{children}</div> }
export function DropdownMenuRadioItem({ children, value, ...props }: any) { return <MenuItem role="menuitemradio" data-value={value} {...props}>{children}</MenuItem> }
export function DropdownMenuLabel({ children, ...props }: any) { return <div role="presentation" {...props}>{children}</div> }
export function DropdownMenuSeparator() { return <MenuDivider /> }
export function DropdownMenuShortcut({ children, ...props }: any) { return <span {...props}>{children}</span> }
export function DropdownMenuSub({ children }: any) { return <>{children}</> }
export function DropdownMenuSubTrigger({ children, ...props }: any) { return <MenuItem {...props}>{children}</MenuItem> }
export function DropdownMenuSubContent({ children, ...props }: any) { return <MenuPopover {...props}><MenuList>{children}</MenuList></MenuPopover> }
export { MenuButton }

