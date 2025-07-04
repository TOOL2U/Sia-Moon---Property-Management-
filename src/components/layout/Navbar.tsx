'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, X, ChevronDown, LogOut, User, Settings } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { useLocalAuth } from '@/hooks/useLocalAuth'
import { cn } from '@/utils/cn'

interface NavLinkProps {
  href: string
  children: React.ReactNode
  className?: string
}

function NavLink({ href, children, className }: NavLinkProps) {
  const pathname = usePathname()
  const isActive = pathname === href

  return (
    <Link
      href={href}
      className={cn(
        'relative px-3 py-2 text-sm font-medium transition-colors duration-150',
        'hover:text-white',
        isActive
          ? 'text-white'
          : 'text-neutral-400 dark:text-neutral-300',
        'after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-full after:origin-left after:scale-x-0 after:bg-primary-400 after:transition-transform after:duration-200',
        isActive && 'after:scale-x-100',
        'hover:after:scale-x-100',
        className
      )}
    >
      {children}
    </Link>
  )
}

interface UserDropdownProps {
  user: any
  onSignOut: () => void
}

function UserDropdown({ user, onSignOut }: UserDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element
      if (!target.closest('[data-dropdown]')) {
        setIsOpen(false)
      }
    }

    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [])

  return (
    <div className="relative" data-dropdown>
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-haspopup="true"
        aria-expanded={isOpen}
        className={cn(
          'flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors duration-150',
          'hover:bg-neutral-100 dark:hover:bg-neutral-800',
          'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2'
        )}
      >
        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary-500 text-xs font-semibold text-white">
          {user.email?.[0]?.toUpperCase() || 'U'}
        </div>
        <span className="hidden sm:block text-neutral-700 dark:text-neutral-100">
          {user.email}
        </span>
        <ChevronDown className={cn(
          'h-4 w-4 text-neutral-500 dark:text-neutral-300 transition-transform duration-150',
          isOpen && 'rotate-180'
        )} />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-56 rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-900 py-2 shadow-lg animate-in fade-in-0 zoom-in-95 duration-200">
          <div className="px-4 py-2 border-b border-neutral-200 dark:border-neutral-700">
            <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
              {user.email}
            </p>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 capitalize">
              {user.role} Account
            </p>
          </div>

          <Link
            href="/profile"
            className="flex items-center gap-3 px-4 py-2 text-sm text-neutral-700 dark:text-neutral-100 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors duration-150"
            onClick={() => setIsOpen(false)}
          >
            <User className="h-4 w-4" />
            Profile
          </Link>

          <Link
            href="/settings"
            className="flex items-center gap-3 px-4 py-2 text-sm text-neutral-700 dark:text-neutral-100 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors duration-150"
            onClick={() => setIsOpen(false)}
          >
            <Settings className="h-4 w-4" />
            Settings
          </Link>

          <div className="border-t border-neutral-200 dark:border-neutral-700 mt-2 pt-2">
            <button
              onClick={() => {
                setIsOpen(false)
                onSignOut()
              }}
              className="flex w-full items-center gap-3 px-4 py-2 text-sm text-neutral-700 dark:text-neutral-100 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors duration-150"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export function Navbar() {
  const { user, signOut } = useLocalAuth()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 0)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const handleSignOut = async () => {
    try {
      console.log('🔄 Navbar: Starting sign out...')
      await signOut()
      console.log('✅ Navbar: Sign out completed')
    } catch (error) {
      console.error('❌ Navbar: Sign out error:', error)
    }
  }

  const navigationLinks = user ? [
    { href: `/dashboard/${user.role}`, label: 'Dashboard' },
    { href: '/properties', label: 'Properties' },
    { href: '/bookings', label: 'Bookings' },
    { href: '/onboard', label: 'Villa Survey' },
    { href: '/developers', label: 'Developers' },
  ] : [
    { href: '/developers', label: 'Developers' },
  ]

  return (
    <header className={cn(
      'sticky top-0 z-50 border-b bg-black/90 backdrop-blur-md transition-all duration-200',
      scrolled ? 'border-neutral-800 shadow-lg' : 'border-transparent'
    )}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center">
            <Link
              href="/"
              className="text-xl font-semibold text-white hover:text-primary-400 transition-colors duration-150"
            >
              Sia Moon
            </Link>
          </div>

          <nav className="hidden md:flex items-center space-x-1">
            {navigationLinks.map((link) => (
              <NavLink key={link.href} href={link.href}>
                {link.label}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            {user ? (
              <UserDropdown user={user} onSignOut={handleSignOut} />
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/auth/login">
                  <Button variant="ghost" size="sm">
                    Sign In
                  </Button>
                </Link>
                <Link href="/auth/signup">
                  <Button size="sm">
                    Get Started
                  </Button>
                </Link>
              </div>
            )}

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden rounded-md p-2 text-neutral-400 hover:bg-neutral-900 hover:text-white"
              aria-label="Toggle Menu"
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden border-t border-neutral-300 dark:border-neutral-600 py-4">
            <div className="space-y-1">
              {navigationLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="block rounded-md px-3 py-2 text-base font-medium text-neutral-700 dark:text-neutral-100 hover:bg-neutral-100 hover:text-neutral-900 dark:hover:bg-neutral-800 dark:hover:text-neutral-100"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
              {!user && (
                <div className="space-y-2 pt-4 border-t border-neutral-300 dark:border-neutral-600">
                  <Link
                    href="/auth/login"
                    className="block rounded-md px-3 py-2 text-base font-medium text-neutral-700 dark:text-neutral-100 hover:bg-neutral-100 hover:text-neutral-900 dark:hover:bg-neutral-800 dark:hover:text-neutral-100"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/auth/signup"
                    className="block rounded-md px-3 py-2 text-base font-medium bg-primary-500 text-white hover:bg-primary-600"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Get Started
                  </Link>
                </div>
              )}
              {user && (
                <div className="space-y-2 pt-4 border-t border-neutral-300 dark:border-neutral-600">
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false)
                      handleSignOut()
                    }}
                    className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-base font-medium text-neutral-700 dark:text-neutral-100 hover:bg-neutral-100 hover:text-neutral-900 dark:hover:bg-neutral-800 dark:hover:text-neutral-100"
                  >
                    <LogOut className="h-4 w-4" />
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  )
}