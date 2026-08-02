import { forwardRef } from 'react'
import { cn } from '@/lib/cn'

const variants = {
  primary: 'btn-primary',
  secondary: 'btn-secondary',
  ghost: 'btn-ghost',
  danger: 'inline-flex items-center justify-center gap-2 px-7 py-3 rounded-full bg-red-600 text-white font-medium text-sm transition-all duration-200 shadow-lg shadow-red-600/25 hover:bg-red-700 active:scale-[0.97]',
}

const sizes = {
  sm: '!px-4 !py-2 !text-xs',
  md: '',
  lg: '!px-8 !py-4 !text-base',
}

const Button = forwardRef(function Button(
  { children, variant = 'primary', size = 'md', loading = false, icon: Icon, className, ...props },
  ref
) {
  return (
    <button
      ref={ref}
      className={cn(
        variants[variant],
        sizes[size],
        loading && 'opacity-70 cursor-not-allowed pointer-events-none',
        className
      )}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading && (
        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      )}
      {Icon && !loading && <Icon className="w-4 h-4" />}
      {children}
    </button>
  )
})

export default Button