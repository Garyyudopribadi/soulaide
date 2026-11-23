import React from 'react'
import { cn } from '@/lib/utils.ts'

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'secondary' | 'outline' | 'success' | 'warning'
}

export const Badge: React.FC<BadgeProps> = ({
  className,
  variant = 'default',
  children,
  ...props
}) => {
  const base =
    'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold tracking-tight transition-colors'

  const variants = {
    default: 'bg-plum-100 text-plum-800 border border-plum-200/70',
    secondary: 'bg-[#F3EFEA] text-[#52475E] border border-[#E6DFD7]',
    outline: 'border border-[#DDD5CC] bg-white/80 text-[#4B3F59]',
    success: 'bg-emerald-50 text-emerald-800 border border-emerald-200/80',
    warning: 'bg-champagne-100 text-champagne-700 border border-champagne-200/90',
  }

  return (
    <span className={cn(base, variants[variant], className)} {...props}>
      {children}
    </span>
  )
}
