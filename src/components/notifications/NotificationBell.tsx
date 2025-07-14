'use client'

import { useState } from 'react'
import { useNotifications } from '@/hooks/useNotifications'
import { Button } from '@/components/ui/Button'
import { Bell, BellRing } from 'lucide-react'
import { NotificationCenter } from './NotificationCenter'

interface NotificationBellProps {
  className?: string
}

export function NotificationBell({ className = '' }: NotificationBellProps) {
  const { unreadCount } = useNotifications()
  const [isOpen, setIsOpen] = useState(false)
  
  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(true)}
        className={`relative ${className}`}
      >
        {unreadCount > 0 ? (
          <BellRing className="h-5 w-5 text-primary-400" />
        ) : (
          <Bell className="h-5 w-5 text-neutral-400" />
        )}
        
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-primary-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </Button>
      
      <NotificationCenter 
        isOpen={isOpen} 
        onClose={() => setIsOpen(false)} 
      />
    </>
  )
}
