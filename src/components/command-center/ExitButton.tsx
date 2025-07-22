'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'

export default function ExitButton() {
  const router = useRouter()

  const handleExit = () => {
    // Navigate back to admin dashboard
    router.push('/admin/backoffice')
  }

  return (
    <Button
      onClick={handleExit}
      variant="outline"
      size="sm"
      className="border-red-600 text-red-400 hover:bg-red-600/10 hover:border-red-500"
    >
      <svg 
        className="w-4 h-4 mr-2" 
        fill="none" 
        stroke="currentColor" 
        viewBox="0 0 24 24"
      >
        <path 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          strokeWidth={2} 
          d="M6 18L18 6M6 6l12 12" 
        />
      </svg>
      Exit Command Center
    </Button>
  )
}
