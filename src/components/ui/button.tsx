import React from 'react'
import { cn } from '@/lib/utils.ts'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive'
  size?: 'sm' | 'md' | 'lg'
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', children, ...props }, ref) => {
    const base =
      'inline-flex items-center justify-center font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none rounded-xl cursor-pointer active:scale-[0.985]'

    const variants = {
      primary:
        'bg-plum-700 text-white hover:bg-plum-800 focus-visible:ring-plum-700 shadow-[0_2px_10px_-2px_rgba(73,46,95,0.4)] hover:shadow-[0_6px_18px_-4px_rgba(73,46,95,0.5)]',
      secondary:
        'bg-plum-100/90 text-plum-800 hover:bg-plum-200/80 focus-visible:ring-plum-600 border border-plum-200/60',
      outline:
        'border border-[#DDD5CC] bg-white hover:bg-sanctuary-100 hover:border-plum-300 text-[#2E223A] focus-visible:ring-plum-500 shadow-2xs',
      ghost:
        'bg-transparent hover:bg-plum-50/80 text-[#4B3F59] hover:text-plum-800 focus-visible:ring-plum-400',
      destructive:
        'bg-rose-600 text-white hover:bg-rose-700 focus-visible:ring-rose-600 shadow-xs',
    }

    const sizes = {
      sm: 'h-9 px-3.5 text-xs',
      md: 'h-10.5 px-4.5 text-sm',
      lg: 'h-12 px-6 text-sm sm:text-base',
    }

    return (
      <button
        ref={ref}
        className={cn(base, variants[variant], sizes[size], className)}
        {...props}
      >
        {children}
      </button>
    )
  }
)

Button.displayName = 'Button'
