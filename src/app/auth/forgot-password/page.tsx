'use client'

import ForgotPasswordForm from '@/components/ForgotPasswordForm'

/**
 * ForgotPasswordPage
 * 
 * Dedicated page for password reset email requests.
 * Uses the standalone ForgotPasswordForm component.
 * 
 * This page is accessible at /auth/forgot-password
 * and provides a clean interface for users to request
 * password reset emails.
 */
export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
      <ForgotPasswordForm 
        onEmailSent={() => {
          console.log('Password reset email sent from dedicated page')
        }}
      />
    </div>
  )
}
