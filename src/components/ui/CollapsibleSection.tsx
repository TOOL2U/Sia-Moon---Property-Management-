import { useState, ReactNode } from 'react'
import { cn } from '@/utils/cn'
import { ChevronDown, ChevronRight } from 'lucide-react'

interface CollapsibleSectionProps {
  title: string
  description?: string
  children: ReactNode
  defaultOpen?: boolean
  required?: boolean
  className?: string
}

export function CollapsibleSection({
  title,
  description,
  children,
  defaultOpen = false,
  required = false,
  className
}: CollapsibleSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  return (
    <div className={cn(
      'border border-neutral-800 rounded-lg overflow-hidden',
      'bg-neutral-950 shadow-lg hover:shadow-xl transition-all duration-200',
      className
    )}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-6 py-5 bg-neutral-900 hover:bg-neutral-800 transition-colors duration-150 text-left flex items-center justify-between group"
      >
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-white flex items-center">
            {title}
            {required && <span className="text-red-400 ml-2">*</span>}
          </h3>
          {description && (
            <p className="text-sm text-neutral-400 mt-1">{description}</p>
          )}
        </div>
        <div className="ml-4">
          {isOpen ? (
            <ChevronDown className="h-5 w-5 text-neutral-400 group-hover:text-white transition-colors duration-150" />
          ) : (
            <ChevronRight className="h-5 w-5 text-neutral-400 group-hover:text-white transition-colors duration-150" />
          )}
        </div>
      </button>

      {isOpen && (
        <div className="px-6 py-6 bg-neutral-950 border-t border-neutral-800">
          {children}
        </div>
      )}
    </div>
  )
}
