'use client'

import dynamic from 'next/dynamic'
import { Suspense } from 'react'

// Dynamic import of the BackOffice component to ensure client-side only rendering
const BackOfficePageComponent = dynamic(
  () => import('@/app/admin/backoffice/page'),
  {
    ssr: false,
    loading: () => (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-white">Loading Back Office...</p>
        </div>
      </div>
    ),
  }
)

export default function BackOfficeClient() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-black flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-white">Loading Back Office...</p>
          </div>
        </div>
      }
    >
      <BackOfficePageComponent />
    </Suspense>
  )
}
