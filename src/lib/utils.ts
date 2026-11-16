import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Build a page URL for navigation.
 * Example:
 *   createPageUrl("home")   -> "/home"
 *   createPageUrl("game1")  -> "/game1"
 */
export function createPageUrl(pageName: string | number): string {
  const slug = String(pageName)
  if (!slug.startsWith("/")) {
    return `/${slug}`
  }
  return slug
}