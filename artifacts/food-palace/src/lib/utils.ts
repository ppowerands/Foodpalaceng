import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { format } from "date-fns"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number): string {
  return `₦${amount.toLocaleString("en-NG")}`
}

export function formatDate(dateStr: string): string {
  return format(new Date(dateStr), "MMM d, yyyy h:mm a")
}

export function formatPrice(amount: number): string {
  return formatCurrency(amount)
}
