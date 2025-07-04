import { SelectHTMLAttributes, forwardRef } from 'react'
import { cn } from '@/utils/cn'
import { ChevronDown } from 'lucide-react'

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  helperText?: string
  options: { value: string; label: string }[]
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, helperText, options, ...props }, ref) => {
    return (
      <div className="space-y-2">
        {label && (
          <label className="block text-sm font-medium text-white mb-2">
            {label}
            {props.required && <span className="text-red-400 ml-1">*</span>}
          </label>
        )}
        <div className="relative">
          <select
            className={cn(
              // Augment dark select styling
              'flex h-10 w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2',
              'text-sm text-white appearance-none',
              'transition-all duration-150',
              'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500',
              'disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-neutral-800',
              // Touch-friendly on mobile
              'touch-manipulation',
              // Error state
              error && 'border-red-500 focus:ring-red-500 focus:border-red-500',
              className
            )}
            ref={ref}
            {...props}
          >
            <option value="" disabled>
              Select an option...
            </option>
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-400 pointer-events-none transition-colors duration-150" />
        </div>
        {helperText && !error && (
          <p className="text-xs text-neutral-400">{helperText}</p>
        )}
        {error && (
          <p className="text-xs text-red-400 font-medium">{error}</p>
        )}
      </div>
    )
  }
)

Select.displayName = 'Select'

export { Select }
