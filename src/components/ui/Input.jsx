import { forwardRef } from 'react'
import { cn } from '@/lib/cn'

const Input = forwardRef(function Input({ label, error, icon: Icon, className, ...props }, ref) {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium mb-2 text-[var(--text)]">
          {label}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <Icon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-[var(--text-secondary)]" />
        )}
        <input
          ref={ref}
          className={cn(
            'input-apple',
            Icon && '!pl-11',
            error && '!border-red-500 focus:!shadow-red-500/15',
            className
          )}
          {...props}
        />
      </div>
      {error && (
        <p className="mt-1.5 text-xs text-red-500">{error}</p>
      )}
    </div>
  )
})

export default Input