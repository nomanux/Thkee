import type { ButtonHTMLAttributes } from "react"
import { fontSemi } from "../fonts"

/* The one button for the whole app.
   Variants match the Components page. Use size "lg" for the main action on a page or form
   (Save, Checkout, Next lesson) and "md" everywhere else. */

export type ButtonVariant = "primary" | "yellow" | "dark" | "secondary" | "soft" | "danger" | "ghost" | "ai"
export type ButtonSize = "md" | "lg"

const base = `inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-700 disabled:pointer-events-none disabled:opacity-50 ${fontSemi}`

const sizes: Record<ButtonSize, string> = {
  md: "h-9 px-4",
  lg: "h-11 px-5",
}

const variants: Record<ButtonVariant, string> = {
  primary: "bg-primary-700 text-white hover:bg-primary-800",
  yellow: "bg-secondary-500 text-slate-900 hover:bg-secondary-600",
  dark: "bg-slate-900 text-white hover:bg-slate-800",
  secondary: "border border-slate-300 bg-white text-slate-800 hover:border-slate-400 hover:bg-slate-50",
  // The "on" state of a toggle, such as Completed or Following.
  soft: "border border-primary-200 bg-primary-50 text-primary-700 hover:bg-primary-100",
  danger: "bg-red-600 text-white hover:bg-red-700",
  ghost: "text-slate-700 hover:bg-slate-100 hover:text-slate-900",
  ai: "bg-ai-600 text-white shadow-ai-button hover:bg-ai-800",
}

// Class string for anything that should look like a button, including links.
export function buttonClass(variant: ButtonVariant = "primary", size: ButtonSize = "md") {
  return `${base} ${sizes[size]} ${variants[variant]}`
}

type Props = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant; size?: ButtonSize }

export default function Button({ variant = "primary", size = "md", className = "", type = "button", ...rest }: Props) {
  return <button type={type} className={`${buttonClass(variant, size)} ${className}`.trim()} {...rest} />
}
