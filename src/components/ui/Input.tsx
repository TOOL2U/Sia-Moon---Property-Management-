import { InputHTMLAttributes, forwardRef } from 'react'
import { cn } from '@/utils/cn'

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: boolean | string
  helperText?: string
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, label, error, helperText, ...props }, ref) => {
    return (
      <div className="space-y-2">
        {label && (
          <label className="block text-sm font-medium text-white mb-2">
            {label}
            {props.required && <span className="text-red-400 ml-1">*</span>}
          </label>
        )}
        <input
          type={type}
          className={cn(
            // Linear input styling with dark theme
            'flex h-10 w-full rounded-lg border border-neutral-700 bg-neutral-900/50 backdrop-blur-sm',
            'px-3 py-2 text-sm text-white placeholder:text-neutral-400',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 focus-visible:ring-offset-black',
            'disabled:cursor-not-allowed disabled:opacity-50',
            'transition-all duration-200',
            'hover:border-neutral-600',
            // Error state
            (error && typeof error === 'boolean') && 'border-red-500 focus-visible:ring-red-500',
            (error && typeof error === 'string') && 'border-red-500 focus-visible:ring-red-500',
            className
          )}
          ref={ref}
          {...props}
        />
        {helperText && !error && (
          <p className="text-xs text-neutral-400">{helperText}</p>
        )}
        {error && (
          <p className="text-xs text-red-400 font-medium">
            {typeof error === 'string' ? error : 'Error in input'}
          </p>
        )}
      </div>
    )
  }
)
Input.displayName = 'Input'

export { Input }
