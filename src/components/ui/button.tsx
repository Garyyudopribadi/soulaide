import React from 'react'
import { cn } from '@/lib/utils.ts'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive'
  size?: 'sm' | 'md' | 'lg'
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', children, ...props }, ref) => {
    const base =
      'inline-flex items-center justify-center font-semibold transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-plum-600 disabled:opacity-50 disabled:pointer-events-none rounded-md cursor-pointer'

    const variants = {
      primary:
        'bg-plum-900 text-[#FBF7F0] hover:bg-plum-800',
      secondary:
        'bg-plum-100 text-plum-900 hover:bg-plum-200/80',
      outline:
        'border border-[#CDC1AE] bg-transparent text-ink hover:bg-plum-50 hover:border-plum-300',
      ghost:
        'bg-transparent text-ink-soft hover:bg-plum-50 hover:text-plum-900',
      destructive:
        'bg-[#8A2F27] text-[#FBF7F0] hover:bg-[#74251F]',
    }

    const sizes = {
      sm: 'h-9 px-3 text-xs',
      md: 'h-10 px-4 text-sm',
      lg: 'h-11 px-5 text-sm',
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
