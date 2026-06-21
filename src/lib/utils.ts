import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function evaluateMath(expr: string): number {
  if (!expr) return 0;
  try {
    // Sanitize input: allow only digits, dots, operators (+-*/) and parens
    const sanitized = expr.replace(/[^-()\d/*+.]/g, '');
    if (!sanitized) return 0;
    
    // Attempt evaluation
    // We use new Function here safely because input is strictly sanitized
    const result = new Function('return ' + sanitized)();
    
    return typeof result === 'number' && !isNaN(result) && isFinite(result) ? result : 0;
  } catch (e) {
    // Return 0 for incomplete/invalid expressions (e.g. "12+")
    return 0;
  }
}
