'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { ArrowUp, ArrowDown } from 'lucide-react'
import { scrollToElement, scrollToTop } from '@/hooks/useLenis'

export default function SmoothScrollTest() {
  return (
    <div className="min-h-screen bg-black text-white">
      {/* Test Section 1 */}
      <section id="section1" className="min-h-screen flex items-center justify-center bg-gradient-to-br from-black to-neutral-900">
        <div className="text-center space-y-6">
          <h1 className="text-4xl font-bold">Smooth Scroll Test - Section 1</h1>
          <p className="text-neutral-400 max-w-2xl">
            This page tests the Apple-like smooth scrolling implementation across the site.
            Try scrolling with your mouse wheel, trackpad, or using the navigation buttons below.
          </p>
          <div className="flex gap-4 justify-center">
            <Button onClick={() => scrollToElement('#section2')}>
              <ArrowDown className="mr-2 h-4 w-4" />
              Go to Section 2
            </Button>
            <Link href="/">
              <Button variant="outline">Back to Home</Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Test Section 2 */}
      <section id="section2" className="min-h-screen flex items-center justify-center bg-gradient-to-br from-neutral-900 to-neutral-800">
        <div className="text-center space-y-6">
          <h2 className="text-4xl font-bold">Section 2</h2>
          <p className="text-neutral-400 max-w-2xl">
            Notice how smooth the scrolling feels? This is powered by Lenis with Apple-like easing curves.
            The scrolling should feel natural and responsive across all devices.
          </p>
          <div className="flex gap-4 justify-center">
            <Button onClick={() => scrollToElement('#section1')}>
              <ArrowUp className="mr-2 h-4 w-4" />
              Go to Section 1
            </Button>
            <Button onClick={() => scrollToElement('#section3')}>
              <ArrowDown className="mr-2 h-4 w-4" />
              Go to Section 3
            </Button>
          </div>
        </div>
      </section>

      {/* Test Section 3 */}
      <section id="section3" className="min-h-screen flex items-center justify-center bg-gradient-to-br from-neutral-800 to-neutral-700">
        <div className="text-center space-y-6">
          <h2 className="text-4xl font-bold">Section 3</h2>
          <p className="text-neutral-400 max-w-2xl">
            The smooth scrolling works with both programmatic navigation (buttons) and anchor links.
            It also respects the user's reduced motion preferences for accessibility.
          </p>
          <div className="flex gap-4 justify-center">
            <Button onClick={() => scrollToTop()}>
              <ArrowUp className="mr-2 h-4 w-4" />
              Scroll to Top
            </Button>
            <Link href="#section2">
              <Button variant="outline">Anchor Link to Section 2</Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Test Section 4 */}
      <section id="section4" className="min-h-screen flex items-center justify-center bg-gradient-to-br from-neutral-700 to-black">
        <div className="text-center space-y-6">
          <h2 className="text-4xl font-bold">Final Section</h2>
          <p className="text-neutral-400 max-w-2xl">
            The smooth scrolling is implemented site-wide and works consistently across all pages.
            Try navigating to other pages to see the smooth scrolling in action everywhere.
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/properties">
              <Button>Test Properties Page</Button>
            </Link>
            <Link href="/dashboard/client">
              <Button variant="outline">Test Dashboard</Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
