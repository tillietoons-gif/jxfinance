"use client"

import * as React from "react"
import { Controller, FormProvider, useFormContext, useFormState, type ControllerProps, type FieldPath, type FieldValues } from "react-hook-form"
import { Label } from "@/components/ui/label"

export const Form = FormProvider

type FormFieldContextValue<TFieldValues extends FieldValues = FieldValues, TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>> = { name: TName }
const FormFieldContext = React.createContext<FormFieldContextValue>({} as FormFieldContextValue)
const FormItemContext = React.createContext<{ id: string }>({} as { id: string })

export const FormField = <TFieldValues extends FieldValues = FieldValues, TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>>({ ...props }: ControllerProps<TFieldValues, TName>) => <FormFieldContext.Provider value={{ name: props.name }}><Controller {...props} /></FormFieldContext.Provider>

export function useFormField() {
  const fieldContext = React.useContext(FormFieldContext)
  const itemContext = React.useContext(FormItemContext)
  const { getFieldState } = useFormContext()
  const formState = useFormState({ name: fieldContext.name })
  const fieldState = getFieldState(fieldContext.name, formState)
  const { id } = itemContext
  return { id, name: fieldContext.name, formItemId: `${id}-form-item`, formDescriptionId: `${id}-form-item-description`, formMessageId: `${id}-form-item-message`, ...fieldState }
}

export function FormItem({ className, ...props }: React.ComponentProps<"div">) { const id = React.useId(); return <FormItemContext.Provider value={{ id }}><div data-slot="form-item" className={["grid gap-2", className].filter(Boolean).join(" ")} {...props} /></FormItemContext.Provider> }
export function FormLabel({ className, ...props }: React.ComponentProps<typeof Label>) { const { error, formItemId } = useFormField(); return <Label data-slot="form-label" data-error={!!error} className={[error ? "text-red-600" : "", className].filter(Boolean).join(" ")} htmlFor={formItemId} {...props} /> }
export function FormControl({ children, ...props }: React.HTMLAttributes<HTMLElement>) { const { error, formItemId, formDescriptionId, formMessageId } = useFormField(); const child = React.Children.only(children) as React.ReactElement<any>; return React.cloneElement(child, { ...props, id: formItemId, "aria-describedby": error ? `${formDescriptionId} ${formMessageId}` : formDescriptionId, "aria-invalid": !!error }) }
export function FormDescription({ className, ...props }: React.ComponentProps<"p">) { const { formDescriptionId } = useFormField(); return <p data-slot="form-description" id={formDescriptionId} className={["text-sm text-gray-500", className].filter(Boolean).join(" ")} {...props} /> }
export function FormMessage({ className, ...props }: React.ComponentProps<"p">) { const { error, formMessageId } = useFormField(); const body = error ? String(error?.message ?? "") : props.children; if (!body) return null; return <p data-slot="form-message" id={formMessageId} className={["text-sm text-red-600", className].filter(Boolean).join(" ")} {...props}>{body}</p> }
