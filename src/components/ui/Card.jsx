import { cn } from '@/lib/cn'

export default function Card({ children, className, hover = true, ...props }) {
  return (
    <div
      className={cn(
        'card overflow-hidden',
        hover && 'cursor-default',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}