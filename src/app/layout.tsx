import { Navbar } from '@/components/layout/Navbar';
import AutomaticJobInitializer from '@/components/system/AutomaticJobInitializer';
import ServiceInitializer from '@/components/system/ServiceInitializer';
import FloatingAIIcon from '@/components/ui/FloatingAIIcon';
import { ToastProvider } from '@/components/ui/SimpleToast';
import { AuthProvider } from '@/contexts/AuthContext';
import '@/lib/polyfills'; // Import polyfills for server-side compatibility
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals'; // Import global polyfills first
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'Villa Property Management',
  description: 'Professional villa property management system',
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
    apple: '/favicon.ico',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body
        className={`${inter.className} antialiased bg-black text-white transition-colors duration-200`}
      >
        <AuthProvider>
          <ToastProvider>
            <ServiceInitializer />
            <AutomaticJobInitializer />
            <Navbar />
            <main className="page-transition">{children}</main>
            <FloatingAIIcon />
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
