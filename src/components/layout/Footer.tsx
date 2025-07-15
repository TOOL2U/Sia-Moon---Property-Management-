import Link from 'next/link'
import { cn } from '@/utils/cn'

interface FooterLinkProps {
  href: string
  children: React.ReactNode
  external?: boolean
}

function FooterLink({ href, children, external = false }: FooterLinkProps) {
  const linkProps = external 
    ? { target: '_blank', rel: 'noopener noreferrer' }
    : {}

  return (
    <Link
      href={href}
      {...linkProps}
      className={cn(
        'text-sm text-neutral-400 hover:text-white transition-colors duration-200',
        'relative after:absolute after:bottom-0 after:left-0 after:h-px after:w-full',
        'after:origin-left after:scale-x-0 after:bg-neutral-300 after:transition-transform after:duration-200',
        'hover:after:scale-x-100'
      )}
    >
      {children}
    </Link>
  )
}

export function Footer() {
  const currentYear = new Date().getFullYear()

  const footerLinks = [
    { href: '/privacy', label: 'Privacy Policy' },
    { href: '/terms', label: 'Terms of Service' },
    { href: '/support', label: 'Support' },
    { href: '/contact', label: 'Contact' },
  ]

  const socialLinks = [
    { href: 'https://twitter.com/siamoon', label: 'Twitter', external: true },
    { href: 'https://linkedin.com/company/siamoon', label: 'LinkedIn', external: true },
  ]

  return (
    <footer className="border-t border-neutral-800 bg-black">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
          {/* Company Info */}
          <div className="lg:col-span-2">
            <div className="flex items-center space-x-2">
              <h3 className="text-lg font-semibold text-white">
                Sia Moon Property Management
              </h3>
            </div>
            <p className="mt-4 text-sm text-neutral-400 max-w-md">
              Premium villa management platform designed for luxury property owners and managers. 
              Streamline operations, maximize revenue, and deliver exceptional guest experiences.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-sm font-semibold text-white mb-4">
              Quick Links
            </h4>
            <ul className="space-y-3">
              <li>
                <FooterLink href="/properties">Properties</FooterLink>
              </li>
              <li>
                <FooterLink href="/onboard">Villa Survey</FooterLink>
              </li>
              <li>
                <FooterLink href="/dashboard/client">Dashboard</FooterLink>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="text-sm font-semibold text-white mb-4">
              Support
            </h4>
            <ul className="space-y-3">
              <li>
                <FooterLink href="/support">Help Center</FooterLink>
              </li>
              <li>
                <FooterLink href="/contact">Contact Us</FooterLink>
              </li>
              <li>
                <FooterLink href="/docs">Documentation</FooterLink>
              </li>
              <li>
                <FooterLink href="/status" external>Status Page</FooterLink>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="mt-12 border-t border-neutral-800 pt-8">
          <div className="flex flex-col items-center justify-between space-y-4 sm:flex-row sm:space-y-0">
            {/* Copyright */}
            <div className="flex items-center space-x-4">
              <p className="text-sm text-neutral-400">
                © {currentYear} Sia Moon Company Limited. All rights reserved.
              </p>
            </div>

            {/* Legal Links */}
            <div className="flex items-center space-x-6">
              {footerLinks.map((link) => (
                <FooterLink key={link.href} href={link.href}>
                  {link.label}
                </FooterLink>
              ))}
            </div>

            {/* Social Links */}
            <div className="flex items-center space-x-4">
              {socialLinks.map((link) => (
                <FooterLink key={link.href} href={link.href} external={link.external}>
                  {link.label}
                </FooterLink>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
