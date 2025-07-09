import { InputHTMLAttributes, forwardRef } from 'react'
import { cn } from '@/utils/cn'
import { Check } from 'lucide-react'

interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string
  description?: string
  error?: string
}

const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, description, error, ...props }, ref) => {
    return (
      <div className="space-y-2">
        <div className="flex items-start space-x-3">
          <div className="relative flex items-center">
            <input
              type="checkbox"
              className={cn(
                // Augment dark checkbox styling with larger touch targets
                'h-5 w-5 rounded border border-neutral-700 bg-neutral-900',
                'transition-all duration-200',
                'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-black',
                'checked:bg-primary-500 checked:border-primary-500',
                'disabled:cursor-not-allowed disabled:opacity-50',
                // Touch-friendly on mobile
                'touch-manipulation',
                // Error state
                error && 'border-red-500 focus:ring-red-500',
                className
              )}
              ref={ref}
              {...props}
            />
            {props.checked && (
              <Check className="absolute inset-0 h-3 w-3 text-white m-auto pointer-events-none" />
            )}
          </div>
          {(label || description) && (
            <div className="flex-1 min-w-0">
              {label && (
                <label className="block text-sm font-medium text-white cursor-pointer">
                  {label}
                  {props.required && <span className="text-red-400 ml-1">*</span>}
                </label>
              )}
              {description && (
                <p className="text-sm text-neutral-400 mt-1">{description}</p>
              )}
            </div>
          )}
        </div>
        {error && (
          <p className="text-sm text-red-400 font-medium ml-8">{error}</p>
        )}
      </div>
    )
  }
)

Checkbox.displayName = 'Checkbox'

export { Checkbox }
