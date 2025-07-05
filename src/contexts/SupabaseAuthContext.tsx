'use client'

import React, { createContext, useContext } from 'react'
import { useSupabaseAuth, UseSupabaseAuthReturn } from '@/hooks/useSupabaseAuth'

const SupabaseAuthContext = createContext<UseSupabaseAuthReturn | undefined>(undefined)

export function SupabaseAuthProvider({ children }: { children: React.ReactNode }) {
  const auth = useSupabaseAuth()

  return (
    <SupabaseAuthContext.Provider value={auth}>
      {children}
    </SupabaseAuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(SupabaseAuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within a SupabaseAuthProvider')
  }
  return context
}

// For backward compatibility, also export as useSupabaseAuth
export { useAuth as useSupabaseAuth }
