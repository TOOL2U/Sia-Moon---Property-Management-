'use client'

import { Button } from '@/components/ui/Button'
import HeroSlideshow from '@/components/ui/HeroSlideshow'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
// TODO: Replace with new auth system when implemented
import {
    CountUpNumber,
    PercentageCounter,
} from '@/components/animations/CountUpNumber'
import {
    heroAnimationVariants,
    heroStaggerContainer
} from '@/hooks/usePageAnimations'
import { motion } from 'framer-motion'
import {
    ArrowRight,
    BarChart3,
    Building2,
    Calendar,
    ChevronRight,
    Globe,
    Shield,
    Star,
} from 'lucide-react'

export default function Home() {
  const router = useRouter()
  // TODO: Replace with new auth system when implemented
  const user = null
  const profile = null
  const loading = false

  // Temporarily disable animations to fix compilation issue
  // const { animationPhase, skipAnimations } = usePageLoadAnimation()
  const animationPhase = 'complete'
  const skipAnimations = true

  // Debug animation state
  useEffect(() => {
    console.log('🎬 Animation state:', { animationPhase, skipAnimations })
  }, [animationPhase, skipAnimations])

  // Hero slideshow configuration
  const heroSlides = [
    {
      id: 'original-hero',
      publicId: 'e36eb55c-9c04-4d51-b1aa-8ce78e49ec97_s5opqn',
      alt: 'Luxury villa hero background - Original',
    },
    {
      id: 'villa-2',
      publicId: 'second hero image',
      alt: 'Luxury villa property - Premium management services',
    },
    {
      id: 'prestige-golfshire',
      publicId: 'Prestige-Golfshire-Villa-1_pf6ibk',
      alt: 'Prestige Golfshire Villa - Exclusive property management',
    },
    {
      id: 'villa-4',
      publicId: 'e36eb55c-9c04-4d51-b1aa-8ce78e49ec97_n90qpl',
      alt: 'Elegant villa exterior - Professional property services',
    },
  ]

  // Redirect authenticated users to dashboard
  useEffect(() => {
    console.log('🔍 Landing page auth check:', {
      loading,
      user: !!user,
      profile: !!profile,
    })

    if (loading) {
      console.log('⏳ Still loading auth state...')
      return
    }

    if (!user) {
      console.log('👤 No user found, staying on landing page')
      return
    }

    if (!profile) {
      console.log('📝 User found but no profile yet, waiting...')
      return
    }

    console.log(
      '✅ User authenticated with profile, redirecting to dashboard...'
    )

    // Try router.push first, then fallback to window.location
    try {
      console.log('🔄 Attempting router.push to /dashboard')
      router.push('/dashboard')

      // Fallback after a short delay if router.push doesn't work
      setTimeout(() => {
        if (typeof window !== 'undefined') {
          console.log('🔄 Router.push fallback - using window.location')
          window.location.href = '/dashboard'
        }
      }, 1000)
    } catch (error) {
      console.error('❌ Router.push failed, using window.location:', error)
      if (typeof window !== 'undefined') {
        window.location.href = '/dashboard'
      }
    }
  }, [user, profile, loading, router])

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Hero Section - Enhanced with slideshow */}
      <section className="relative min-h-screen lg:min-h-[95vh] flex items-center justify-center overflow-hidden">
        {' '}
        {/* Hero Slideshow Background - Always visible with animation */}
        <motion.div
          className="absolute inset-0"
          variants={heroAnimationVariants.backgroundImage}
          initial="initial"
          animate={
            skipAnimations
              ? { opacity: 1, scale: 1 }
              : animationPhase !== 'loading'
                ? 'animate'
                : { opacity: 1, scale: 1 }
          }
        >
          <HeroSlideshow
            slides={heroSlides}
            autoPlayInterval={6000}
            showDots={true}
            showArrows={false}
            className="w-full h-full"
          />
        </motion.div>
        <div className="relative max-w-7xl mx-auto px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div
              variants={heroStaggerContainer}
              initial="initial"
              animate={
                skipAnimations
                  ? 'animate'
                  : animationPhase !== 'loading'
                    ? 'animate'
                    : 'animate'
              }
            >
              {/* Main headline - Slower, smoother staggered animation */}
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight leading-tight">
                <motion.span
                  className="block bg-gradient-to-r from-white/90 via-gray-500 via-80% to-transparent bg-clip-text text-transparent"
                  variants={heroAnimationVariants.headline}
                  custom={0}
                >
                  A purpose-built platform.
                </motion.span>
                <motion.span
                  className="block bg-gradient-to-r from-white/90 via-gray-500 via-80% to-transparent bg-clip-text text-transparent mb-3"
                  variants={heroAnimationVariants.headline}
                  custom={1}
                >
                  Designed for Property Success.
                </motion.span>
              </h1>

              {/* Enhanced Subtitle with smoother blur-to-clear effect */}
              <motion.div
                variants={heroAnimationVariants.subtitle}
                initial="initial"
                animate={
                  skipAnimations
                    ? { opacity: 1, y: 0, filter: 'blur(0px)' }
                    : animationPhase !== 'loading'
                      ? 'animate'
                      : { opacity: 1, y: 0, filter: 'blur(0px)' }
                }
              >
                <p className="text-l text-white-400 max-w-2xl mx-auto mb-1 mt-5 leading-relaxed bg-clip-text bg-gradient-to-r from-white via-gray-300 via-80% to-transparent text-transparent">
                  Meet the system for modern property management.
                </p>
                <p className="text-l text-white-400 max-w-2xl mx-auto mb-10 leading-relaxed bg-clip-text bg-gradient-to-r from-white via-gray-400 via-80% to-transparent text-transparent">
                  Streamline bookings, maintenance, and reporting with a modern,
                  automated workflow.
                </p>
              </motion.div>

              {/* CTA buttons - Slower, smoother coordinated sequence */}
              <motion.div
                className="flex flex-col sm:flex-row gap-4 mb-16 justify-center"
                variants={heroStaggerContainer}
                initial="initial"
                animate={
                  skipAnimations
                    ? 'animate'
                    : animationPhase !== 'loading'
                      ? 'animate'
                      : 'animate'
                }
              >
                <Link href="/auth/signup">
                  <motion.div
                    variants={heroAnimationVariants.ctaButton}
                    custom={0}
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Button
                      size="lg"
                      className="bg-gradient-to-r bg-clip-text from-white via-50% to-transparent text-white hover:from-gray-10 hover:to-gray-10 px-8 py-4 text-base font-semibold shadow-2xl hover:shadow-white/20 transition-all duration-300 border border-white/50 backdrop-blur-sm hover:text-white"
                    >
                      Launch Your Portfolio
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </motion.div>
                </Link>
                <Link href="/dashboard">
                  <motion.div
                    variants={heroAnimationVariants.ctaButton}
                    custom={1}
                    whileHover={{ scale: 1.02, x: 5 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Button
                      variant="outline"
                      size="lg"
                      className="border-2 border-white/30 text-white hover:bg-white/10 hover:border-white/50 px-8 py-4 text-base font-medium backdrop-blur-sm hover:shadow-lg hover:shadow-white/10 transition-all duration-300 group"
                    >
                      Sign In
                    </Button>
                  </motion.div>
                </Link>
              </motion.div>

              {/* Trusted By Section - Always visible with optional animation */}
              <motion.div
                className="mb-12"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{
                  delay: skipAnimations ? 0 : 3.0,
                  duration: skipAnimations ? 0.3 : 0.8,
                }}
              >
                <motion.p
                  className="text-xs uppercase tracking-wider text-gray-500 text-center mb-6 font-medium"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    delay: skipAnimations ? 0.1 : 3.2,
                    duration: skipAnimations ? 0.3 : 0.6,
                  }}
                >
                  Trusted by leading platforms
                </motion.p>
                <motion.div
                  className="flex flex-wrap items-center justify-center gap-8 md:gap-12"
                  variants={heroStaggerContainer}
                  initial="initial"
                  animate="animate"
                >
                  {/* Airbnb Logo - Enhanced with staggered animation */}
                  <motion.div
                    className="opacity-70 hover:opacity-100 transition-all duration-300 hover:scale-105"
                    variants={heroAnimationVariants.trustedLogo}
                    custom={0}
                  >
                    <svg
                      className="h-6 w-auto text-white"
                      viewBox="0 0 1000 1000"
                      fill="currentColor"
                    >
                      <path d="M499.3 736.7c-51-64-81-120.1-91-168.1-10-39-6-70 11-93 18-27 45-40 80-40s62 13 80 40c17 23 21 54 11 93-10 48-40 104.1-91 168.1-5 6-10 12-15 18-5-6-10-12-15-18zm362.2 43c-7 47-39 86-83 105-85 37-169.1-31-241.1-102 119.1-149.1 141.1-265.1 119.1-351.1-17-65-61-117-122-148C484.3 258.6 437.3 254.6 392.3 268.6c-61 31-105 83-122 148-22 86 0 202 119.1 351.1-72 71-156.1 139-241.1 102-44-19-76-58-83-105-7-52 14-108 58-162 11-15 25-30 41-45l41-33c143-109 263-250 263-250s120 141 263 250l41 33c16 15 30 30 41 45 44 54 65 110 58 162z" />
                    </svg>
                  </motion.div>

                  {/* Booking.com Logo - Enhanced with staggered animation */}
                  <motion.div
                    className="opacity-70 hover:opacity-100 transition-all duration-300 hover:scale-105"
                    variants={heroAnimationVariants.trustedLogo}
                    custom={1}
                  >
                    <svg
                      className="h-6 w-auto text-gray-400"
                      viewBox="0 0 200 50"
                      fill="currentColor"
                    >
                      <path d="M20 10h15c8.3 0 15 6.7 15 15s-6.7 15-15 15H20V10zm0 25h15c2.8 0 5-2.2 5-5s-2.2-5-5-5H20v10zm45-25h15c8.3 0 15 6.7 15 15s-6.7 15-15 15H65V10zm0 25h15c2.8 0 5-2.2 5-5s-2.2-5-5-5H65v10zm45-25h15c8.3 0 15 6.7 15 15s-6.7 15-15 15h-15V10zm0 25h15c2.8 0 5-2.2 5-5s-2.2-5-5-5h-15v10zm45-25h15c8.3 0 15 6.7 15 15s-6.7 15-15 15h-15V10zm0 25h15c2.8 0 5-2.2 5-5s-2.2-5-5-5h-15v10z" />
                      <text x="20" y="45" fontSize="8" fill="currentColor">
                        booking.com
                      </text>
                    </svg>
                  </motion.div>
                </motion.div>
              </motion.div>

              {/* Trust indicators - Security & Support */}
              <div className="flex flex-wrap items-center justify-center gap-8 text-xs text-gray-500">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  <span>Enterprise security</span>
                </div>
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  <span>Global support</span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section - Linear style with enhanced animations */}
      <section
        id="features"
        className="py-24 sm:py-32 bg-black relative overflow-hidden"
      >
        {/* Subtle gradient background effect */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.03),transparent_70%)]"></div>

        <div className="max-w-7xl mx-auto px-6 lg:px-8 relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            viewport={{ once: true, margin: '-100px' }}
            className="max-w-2xl mx-auto text-center mb-16"
          >
            <motion.h2
              className="text-3xl sm:text-4xl font-bold tracking-tight mb-6"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.1 }}
              viewport={{ once: true }}
            >
              Built for modern property management
            </motion.h2>
            <motion.p
              className="text-lg text-gray-400"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              viewport={{ once: true }}
            >
              Everything you need to manage luxury properties efficiently and
              professionally.
            </motion.p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 - Enhanced with premium hover effects */}
            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              transition={{
                duration: 0.5,
                delay: 0.1,
                ease: [0.25, 0.46, 0.45, 0.94],
              }}
              viewport={{ once: true, margin: '-50px' }}
              className="group"
            >
              <div className="bg-gradient-to-br from-white/[0.07] to-transparent rounded-xl p-8 border border-white/10 hover:border-white/20 hover:bg-white/[0.08] transition-all duration-300 hover:shadow-2xl hover:shadow-white/5 hover:-translate-y-1 backdrop-blur-sm">
                <motion.div
                  className="h-12 w-12 bg-gradient-to-br from-white/20 to-white/10 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300"
                  whileHover={{ rotate: 5, scale: 1.1 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 10 }}
                >
                  <Building2 className="h-6 w-6 text-white group-hover:text-white transition-colors duration-300" />
                </motion.div>
                <h3 className="text-xl font-semibold mb-4 group-hover:text-white transition-colors duration-300">
                  Property Management
                </h3>
                <p className="text-gray-400 leading-relaxed group-hover:text-gray-300 transition-colors duration-300">
                  Centralized dashboard to manage all your luxury properties
                  with real-time insights and analytics.
                </p>
              </div>
            </motion.div>

            {/* Feature 2 - Enhanced with premium hover effects */}
            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              transition={{
                duration: 0.5,
                delay: 0.2,
                ease: [0.25, 0.46, 0.45, 0.94],
              }}
              viewport={{ once: true, margin: '-50px' }}
              className="group"
            >
              <div className="bg-gradient-to-br from-white/[0.07] to-transparent rounded-xl p-8 border border-white/10 hover:border-white/20 hover:bg-white/[0.08] transition-all duration-300 hover:shadow-2xl hover:shadow-white/5 hover:-translate-y-1 backdrop-blur-sm">
                <motion.div
                  className="h-12 w-12 bg-gradient-to-br from-white/20 to-white/10 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300"
                  whileHover={{ rotate: 5, scale: 1.1 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 10 }}
                >
                  <Calendar className="h-6 w-6 text-white group-hover:text-white transition-colors duration-300" />
                </motion.div>
                <h3 className="text-xl font-semibold mb-4 group-hover:text-white transition-colors duration-300">
                  Smart Booking
                </h3>
                <p className="text-gray-400 leading-relaxed group-hover:text-gray-300 transition-colors duration-300">
                  Automated booking management with dynamic pricing and seamless
                  guest communication.
                </p>
              </div>
            </motion.div>

            {/* Feature 3 - Enhanced with premium hover effects */}
            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              transition={{
                duration: 0.5,
                delay: 0.3,
                ease: [0.25, 0.46, 0.45, 0.94],
              }}
              viewport={{ once: true, margin: '-50px' }}
              className="group"
            >
              <div className="bg-gradient-to-br from-white/[0.07] to-transparent rounded-xl p-8 border border-white/10 hover:border-white/20 hover:bg-white/[0.08] transition-all duration-300 hover:shadow-2xl hover:shadow-white/5 hover:-translate-y-1 backdrop-blur-sm">
                <motion.div
                  className="h-12 w-12 bg-gradient-to-br from-white/20 to-white/10 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300"
                  whileHover={{ rotate: 5, scale: 1.1 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 10 }}
                >
                  <BarChart3 className="h-6 w-6 text-white group-hover:text-white transition-colors duration-300" />
                </motion.div>
                <h3 className="text-xl font-semibold mb-4 group-hover:text-white transition-colors duration-300">
                  Analytics & Insights
                </h3>
                <p className="text-gray-400 leading-relaxed group-hover:text-gray-300 transition-colors duration-300">
                  Comprehensive reporting and analytics to optimize performance
                  and maximize revenue.
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats Section - Enhanced with premium animations */}
      <section className="py-24 sm:py-32 bg-black relative overflow-hidden">
        {/* Premium background effects */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_70%,rgba(255,255,255,0.02),transparent_70%)]"></div>
        <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_40%,rgba(255,255,255,0.01)_60%,transparent_80%)]"></div>

        <div className="max-w-7xl mx-auto px-6 lg:px-8 relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] }}
            viewport={{ once: true, margin: '-100px' }}
            className="text-center mb-16"
          >
            <motion.h2
              className="text-3xl sm:text-4xl font-bold tracking-tight mb-6"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.1 }}
              viewport={{ once: true }}
            >
              Trusted by property managers worldwide
            </motion.h2>
            <motion.p
              className="text-lg text-gray-400 max-w-2xl mx-auto"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              viewport={{ once: true }}
            >
              Join thousands of property owners who have transformed their
              operations with our platform.
            </motion.p>
          </motion.div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Stat 1 - Enhanced with premium effects */}
            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.9 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              transition={{
                duration: 0.5,
                delay: 0.1,
                ease: [0.25, 0.46, 0.45, 0.94],
              }}
              viewport={{ once: true, margin: '-50px' }}
              className="text-center group cursor-default"
            >
              <motion.div
                className="p-6 hover:border-white/20 hover:bg-white/[0.08] transition-all duration-300 hover:shadow-xl hover:shadow-white/1 backdrop-blur-sm rounded-2xl"
                whileHover={{ y: -8, scale: 1.02 }}
                transition={{ type: 'spring', stiffness: 400, damping: 17 }}
              >
                <CountUpNumber
                  end={500}
                  suffix="+"
                  className="text-4xl font-bold mb-2 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent"
                />
                <div className="text-gray-400 group-hover:text-gray-300 transition-colors duration-300">
                  Properties managed
                </div>
              </motion.div>
            </motion.div>

            {/* Stat 2 - Enhanced with premium effects */}
            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.9 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              transition={{
                duration: 0.5,
                delay: 0.2,
                ease: [0.25, 0.46, 0.45, 0.94],
              }}
              viewport={{ once: true, margin: '-50px' }}
              className="text-center group cursor-default"
            >
              <motion.div
                className="p-6 hover:border-white/20 hover:bg-white/[0.08] transition-all duration-300 hover:shadow-xl hover:shadow-white/1 backdrop-blur-sm rounded-2xl"
                whileHover={{ y: -8, scale: 1.02 }}
                transition={{ type: 'spring', stiffness: 400, damping: 17 }}
              >
                <PercentageCounter
                  end={99.9}
                  className="text-4xl font-bold mb-2 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent"
                />
                <div className="text-gray-400 group-hover:text-gray-300 transition-colors duration-300">
                  Uptime guarantee
                </div>
              </motion.div>
            </motion.div>

            {/* Stat 3 - Enhanced with premium effects */}
            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.9 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              transition={{
                duration: 0.5,
                delay: 0.3,
                ease: [0.25, 0.46, 0.45, 0.94],
              }}
              viewport={{ once: true, margin: '-50px' }}
              className="text-center group cursor-default"
            >
              <motion.div
                className="p-6 hover:border-white/20 hover:bg-white/[0.08] transition-all duration-300 hover:shadow-xl hover:shadow-white/1 backdrop-blur-sm rounded-2xl"
                whileHover={{ y: -8, scale: 1.02 }}
                transition={{ type: 'spring', stiffness: 400, damping: 17 }}
              >
                <motion.div
                  className="text-4xl font-bold mb-2 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent"
                  initial={{ scale: 1 }}
                  whileInView={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 1.2, delay: 0.5, times: [0, 0.5, 1] }}
                >
                  30%
                </motion.div>
                <div className="text-gray-400 group-hover:text-gray-300 transition-colors duration-300">
                  Average revenue increase
                </div>
              </motion.div>
            </motion.div>

            {/* Stat 4 - Enhanced with premium effects */}
            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.9 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              transition={{
                duration: 0.5,
                delay: 0.4,
                ease: [0.25, 0.46, 0.45, 0.94],
              }}
              viewport={{ once: true, margin: '-50px' }}
              className="text-center group cursor-default"
            >
              <motion.div
                className="p-6 hover:border-white/20 hover:bg-white/[0.08] transition-all duration-300 hover:shadow-xl hover:shadow-white/1 backdrop-blur-sm rounded-2xl"
                whileHover={{ y: -8, scale: 1.02 }}
                transition={{ type: 'spring', stiffness: 400, damping: 17 }}
              >
                <motion.div
                  className="text-4xl font-bold mb-2 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent"
                  initial={{ scale: 1 }}
                  whileInView={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 1.2, delay: 0.6, times: [0, 0.5, 1] }}
                >
                  24/7
                </motion.div>
                <div className="text-gray-400 group-hover:text-gray-300 transition-colors duration-300">
                  Customer support
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Benefits Section - Enhanced with premium animations */}
      <section className="py-24 sm:py-32 bg-black relative overflow-hidden">
        {/* Subtle background pattern */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_10%_20%,rgba(255,255,255,0.02),transparent_70%)]"></div>
        <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent_40%,rgba(255,255,255,0.01)_60%,transparent_80%)]"></div>

        <div className="max-w-7xl mx-auto px-6 lg:px-8 relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
            viewport={{ once: true, margin: '-100px' }}
            className="max-w-2xl mx-auto text-center mb-16"
          >
            <motion.h2
              className="text-3xl sm:text-4xl font-bold tracking-tight mb-6"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.1 }}
              viewport={{ once: true }}
            >
              Maximize your revenue and streamline operations
            </motion.h2>
            <motion.p
              className="text-lg text-gray-400"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              viewport={{ once: true }}
            >
              Our tools are designed to help you achieve higher occupancy rates
              and increased guest satisfaction.
            </motion.p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Benefit 1 - Enhanced with premium effects */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.6,
                delay: 0.1,
                ease: [0.25, 0.46, 0.45, 0.94],
              }}
              viewport={{ once: true, margin: '-50px' }}
              className="group"
            >
              <motion.div
                className="bg-gradient-to-br from-white/[0.07] to-transparent rounded-lg p-8 border border-white/10 hover:border-white/20 transition-all duration-300 hover:shadow-xl hover:shadow-white/5"
                whileHover={{ y: -5, scale: 1.01 }}
                transition={{ type: 'spring', stiffness: 400, damping: 17 }}
              >
                <motion.div
                  className="h-12 w-12 bg-gradient-to-br from-white/20 to-white/5 rounded-lg flex items-center justify-center mb-6"
                  whileHover={{ rotate: 5, scale: 1.05 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 10 }}
                >
                  <Star className="h-6 w-6 text-white" />
                </motion.div>
                <h3 className="text-xl font-semibold mb-4 group-hover:text-white transition-colors duration-300">
                  Increased Visibility
                </h3>
                <p className="text-gray-400 leading-relaxed group-hover:text-gray-300 transition-colors duration-300">
                  Get discovered by more guests with our optimized listing
                  distribution.
                </p>
              </motion.div>
            </motion.div>

            {/* Benefit 2 - Enhanced with premium effects */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.6,
                delay: 0.2,
                ease: [0.25, 0.46, 0.45, 0.94],
              }}
              viewport={{ once: true, margin: '-50px' }}
              className="group"
            >
              <motion.div
                className="bg-gradient-to-br from-white/[0.07] to-transparent rounded-lg p-8 border border-white/10 hover:border-white/20 transition-all duration-300 hover:shadow-xl hover:shadow-white/5"
                whileHover={{ y: -5, scale: 1.01 }}
                transition={{ type: 'spring', stiffness: 400, damping: 17 }}
              >
                <motion.div
                  className="h-12 w-12 bg-gradient-to-br from-white/20 to-white/5 rounded-lg flex items-center justify-center mb-6"
                  whileHover={{ rotate: 5, scale: 1.05 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 10 }}
                >
                  <Shield className="h-6 w-6 text-white" />
                </motion.div>
                <h3 className="text-xl font-semibold mb-4 group-hover:text-white transition-colors duration-300">
                  Secure Transactions
                </h3>
                <p className="text-gray-400 leading-relaxed group-hover:text-gray-300 transition-colors duration-300">
                  Enjoy peace of mind with our secure payment processing and
                  fraud protection.
                </p>
              </motion.div>
            </motion.div>

            {/* Benefit 3 - Enhanced with premium effects */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.6,
                delay: 0.3,
                ease: [0.25, 0.46, 0.45, 0.94],
              }}
              viewport={{ once: true, margin: '-50px' }}
              className="group"
            >
              <motion.div
                className="bg-gradient-to-br from-white/[0.07] to-transparent rounded-lg p-8 border border-white/10 hover:border-white/20 transition-all duration-300 hover:shadow-xl hover:shadow-white/5"
                whileHover={{ y: -5, scale: 1.01 }}
                transition={{ type: 'spring', stiffness: 400, damping: 17 }}
              >
                <motion.div
                  className="h-12 w-12 bg-gradient-to-br from-white/20 to-white/5 rounded-lg flex items-center justify-center mb-6"
                  whileHover={{ rotate: 5, scale: 1.05 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 10 }}
                >
                  <Globe className="h-6 w-6 text-white" />
                </motion.div>
                <h3 className="text-xl font-semibold mb-4 group-hover:text-white transition-colors duration-300">
                  Global Reach
                </h3>
                <p className="text-gray-400 leading-relaxed group-hover:text-gray-300 transition-colors duration-300">
                  Connect with travelers from around the world and expand your
                  market reach.
                </p>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section - Enhanced with premium animations */}
      <section className="py-24 sm:py-32 bg-gradient-to-b from-black via-black/95 to-black relative overflow-hidden">
        {/* Premium background effects */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.03),transparent_70%)]"></div>
        <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_30%,rgba(255,255,255,0.01)_50%,transparent_70%)]"></div>

        {/* Floating particles effect (subtle) */}
        <motion.div
          className="absolute top-20 right-[20%] w-2 h-2 rounded-full bg-white/10"
          animate={{ y: [-10, 10], opacity: [0.5, 0.8, 0.5] }}
          transition={{ duration: 4, repeat: Infinity, repeatType: 'reverse' }}
        />
        <motion.div
          className="absolute bottom-40 left-[30%] w-1 h-1 rounded-full bg-white/10"
          animate={{ y: [-15, 15], opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 5, repeat: Infinity, repeatType: 'reverse' }}
        />
        <motion.div
          className="absolute top-1/3 left-[10%] w-1.5 h-1.5 rounded-full bg-white/10"
          animate={{ y: [-20, 20], opacity: [0.4, 0.7, 0.4] }}
          transition={{ duration: 7, repeat: Infinity, repeatType: 'reverse' }}
        />

        <div className="max-w-7xl mx-auto px-6 lg:px-8 relative">
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
            viewport={{ once: true, margin: '-100px' }}
            className="text-center"
          >
            <motion.h2
              className="text-3xl sm:text-4xl font-bold tracking-tight mb-6 bg-gradient-to-r from-white via-gray-200 to-white bg-clip-text text-transparent"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              viewport={{ once: true }}
            >
              Ready to transform your property management?
            </motion.h2>
            <motion.p
              className="text-lg text-gray-400 max-w-2xl mx-auto mb-10"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.3 }}
              viewport={{ once: true }}
            >
              Join thousands of property owners who trust Sia Moon to maximize
              their revenue and streamline operations.
            </motion.p>
            <motion.div
              className="flex flex-col sm:flex-row gap-4 justify-center"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.4 }}
              viewport={{ once: true }}
            >
              <Link href="/auth/signup">
                <motion.div
                  whileHover={{ scale: 1.05, y: -3 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ duration: 0.2 }}
                >
                  <Button
                    size="lg"
                    className="bg-gradient-to-r from-white via-white/90 to-gray-100 text-black hover:bg-white/90 px-8 py-4 text-base font-medium shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_25px_rgba(255,255,255,0.2)] transition-all duration-300"
                  >
                    Get Started
                    <motion.div
                      animate={{ x: [0, 4, 0] }}
                      transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        repeatType: 'loop',
                        ease: 'easeInOut',
                        repeatDelay: 1,
                      }}
                    >
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </motion.div>
                  </Button>
                </motion.div>
              </Link>
              <motion.div whileHover={{ x: 5 }} transition={{ duration: 0.2 }}>
                <Link
                  href="https://wa.me/66933880630"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center text-gray-400 hover:text-white transition-all duration-300 hover:bg-white/5 px-4 py-3 rounded-lg group"
                >
                  Contact Us
                  <motion.div
                    className="ml-1"
                    animate={{ x: [0, 2, 0] }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      repeatType: 'loop',
                      ease: 'easeInOut',
                      repeatDelay: 1,
                    }}
                  >
                    <ChevronRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                  </motion.div>
                </Link>
              </motion.div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Footer - Professional Linear style */}
      <footer className="bg-black border-t border-white/10">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
            {/* Company Info */}
            <div className="lg:col-span-1">
              <div className="mb-6">
                <span className="text-xl font-semibold text-white">
                  Sia Moon
                </span>
              </div>
              <p className="text-gray-400 text-sm">
                Professional villa property management services. Maximize your
                rental income with our comprehensive management solutions.
              </p>
            </div>

            {/* Services */}
            <div>
              <h3 className="text-white font-semibold mb-6">Services</h3>
              <ul className="space-y-4 text-sm text-gray-400">
                <li>
                  <Link
                    href="/services/management"
                    className="hover:text-white transition-colors"
                  >
                    Property Management
                  </Link>
                </li>
                <li>
                  <Link
                    href="/services/marketing"
                    className="hover:text-white transition-colors"
                  >
                    Marketing & Listing
                  </Link>
                </li>
                <li>
                  <Link
                    href="/services/maintenance"
                    className="hover:text-white transition-colors"
                  >
                    Maintenance
                  </Link>
                </li>
                <li>
                  <Link
                    href="/services/cleaning"
                    className="hover:text-white transition-colors"
                  >
                    Cleaning Services
                  </Link>
                </li>
                <li>
                  <Link
                    href="/services/guest"
                    className="hover:text-white transition-colors"
                  >
                    Guest Management
                  </Link>
                </li>
              </ul>
            </div>

            {/* Company */}
            <div>
              <h3 className="text-white font-semibold mb-6">Company</h3>
              <ul className="space-y-4 text-sm text-gray-400">
                <li>
                  <Link
                    href="/about"
                    className="hover:text-white transition-colors"
                  >
                    About Us
                  </Link>
                </li>
                <li>
                  <Link
                    href="/careers"
                    className="hover:text-white transition-colors"
                  >
                    Careers
                  </Link>
                </li>
                <li>
                  <Link
                    href="/blog"
                    className="hover:text-white transition-colors"
                  >
                    Blog
                  </Link>
                </li>
                <li>
                  <Link
                    href="/press"
                    className="hover:text-white transition-colors"
                  >
                    Press
                  </Link>
                </li>
                <li>
                  <Link
                    href="/partners"
                    className="hover:text-white transition-colors"
                  >
                    Partners
                  </Link>
                </li>
              </ul>
            </div>

            {/* Support */}
            <div>
              <h3 className="text-white font-semibold mb-6">Support</h3>
              <ul className="space-y-4 text-sm text-gray-400">
                <li>
                  <Link
                    href="/help"
                    className="hover:text-white transition-colors"
                  >
                    Help Center
                  </Link>
                </li>
                <li>
                  <Link
                    href="/contact"
                    className="hover:text-white transition-colors"
                  >
                    Contact Us
                  </Link>
                </li>
                <li>
                  <Link
                    href="/privacy"
                    className="hover:text-white transition-colors"
                  >
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link
                    href="/terms"
                    className="hover:text-white transition-colors"
                  >
                    Terms of Service
                  </Link>
                </li>
                <li>
                  <Link
                    href="/status"
                    className="hover:text-white transition-colors"
                  >
                    System Status
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom section */}
          <div className="mt-12 pt-8 border-t border-white/10">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="text-sm text-gray-500">
                © 2024 Sia Moon Property Management. All rights reserved.
              </div>
              <div className="text-sm text-gray-400">
                <Link
                  href="/sitemap"
                  className="hover:text-white transition-colors"
                >
                  Sitemap
                </Link>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
