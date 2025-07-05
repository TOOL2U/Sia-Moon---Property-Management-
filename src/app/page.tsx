'use client';

import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import CloudinaryImage from '@/components/ui/CloudinaryImage'
import { useScrollAnimationGroup } from '@/hooks/useScrollAnimation'
import { Building, Users, Calendar, BarChart3, ArrowRight, Star, CheckCircle, Shield, Globe } from 'lucide-react'
import { motion } from "framer-motion";

export default function Home() {
  const trustedByRef = useScrollAnimationGroup()
  const featuresRef = useScrollAnimationGroup()
  const benefitsRef = useScrollAnimationGroup()
  const ctaRef = useScrollAnimationGroup()

  return (
  <div className="min-h-screen bg-black">
  {/* Hero Section - Linear-inspired dark design with Cloudinary background */}
  <section className="relative overflow-hidden min-h-[85vh] flex items-center">
    {/* Cloudinary Hero Image Background with 50% opacity */}
   <motion.div
  className="absolute inset-0"
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  transition={{ duration: 2, ease: "easeOut" }}
>
  <CloudinaryImage
    publicId="e36eb55c-9c04-4d51-b1aa-8ce78e49ec97_s5opqn"
    alt="Luxury villa hero background"
    fill
    priority
    opacity={25}
    quality="auto"
    format="webp"
    crop="fill"
    gravity="center"
    className="object-cover"
    sizes="100vw"
  />
</motion.div>

    {/* Dark gradient overlay for better text readability - Left to Right */}
    <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/65 to-transparent"></div>

    {/* Subtle animated stars background for depth */}
    <div className="absolute inset-0 bg-[url('data:image/svg+xml;utf8,<svg width=\'120\' height=\'120\' xmlns=\'http://www.w3.org/2000/svg\'><circle cx=\'20\' cy=\'30\' r=\'1.5\' fill=\'white\' fill-opacity=\'0.3\'/><circle cx=\'90\' cy=\'80\' r=\'1.2\' fill=\'white\' fill-opacity=\'0.25\'/><circle cx=\'50\' cy=\'20\' r=\'1\' fill=\'white\' fill-opacity=\'0.25\'/><circle cx=\'100\' cy=\'40\' r=\'1.3\' fill=\'white\' fill-opacity=\'0.25\'/><circle cx=\'70\' cy=\'60\' r=\'1.2\' fill=\'white\' fill-opacity=\'0.2\'/><circle cx=\'30\' cy=\'100\' r=\'1.4\' fill=\'white\' fill-opacity=\'0.2\'/></svg>')] [background-size:250px_250px] animate-[moveStars_180s_linear_infinite] opacity-20"></div>

    <div className="relative mx-auto max-w-7xl px-6 py-20 sm:py-32 lg:px-8 w-full">
      <div className="mx-auto max-w-4xl text-center">
        {/* Linear-style headline with enhanced animations */}
<h1 className="text-4xl font-semibold tracking-tight bg-gradient-to-r from-white to-neutral-700 bg-clip-text text-transparent sm:text-5xl lg:text-6xl animate-fade-in-up will-change-transform">   
         Premium Property Management
<span className="block bg-gradient-to-r from-white to-neutral-700 bg-clip-text text-transparent animate-fade-in-up animate-delay-400">          
    made simple
          </span>
        </h1>

            {/* Subtitle with ultra-slow timing */}
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-neutral-300 animate-fade-in-up animate-delay-1000 will-change-transform">
              Transform your luxury villa operations with our comprehensive platform.
              Manage bookings, coordinate staff, and delight guests while maximizing revenue.
            </p>

            {/* CTA buttons with ultra-slow coordinated timing */}
            <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:justify-center animate-fade-in-up animate-delay-1600">
              <Link href="/auth/signup" className="group">
                <Button
                  size="lg"
                  className="h-12 px-8 text-sm font-medium btn-hover-lift will-change-transform"
                >
                  Get started
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1 icon-hover" />
                </Button>
              </Link>
              <Link href="#features">
                <Button
                  variant="outline"
                  size="lg"
                  className="h-12 px-8 text-sm font-medium border-neutral-700 text-neutral-300 hover:bg-neutral-900 hover:border-neutral-600 hover:text-white transition-all duration-200 btn-hover-scale will-change-transform"
                >
                  Learn more
                </Button>
              </Link>
            </div>

            {/* Trust indicators with ultra-slow staggered timing */}
            <div className="mt-16 grid grid-cols-3 gap-8 sm:gap-12">
              <div className="text-center animate-fade-in-up animate-delay-2000 hover-scale-sm will-change-transform">
                <div className="text-2xl font-semibold text-white">50+</div>
                <div className="text-sm text-neutral-400">Luxury villas</div>
              </div>
              <div className="text-center animate-fade-in-up animate-delay-2200 hover-scale-sm will-change-transform">
                <div className="text-2xl font-semibold text-white">1000+</div>
                <div className="text-sm text-neutral-400">Happy guests</div>
              </div>
              <div className="text-center animate-fade-in-up animate-delay-2400 hover-scale-sm will-change-transform">
                <div className="text-2xl font-semibold text-white">24/7</div>
                <div className="text-sm text-neutral-400">Support</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trusted By Section - Linear dark style with scroll animations */}
      <section id="trusted-by" className="py-16 border-y border-neutral-800 bg-neutral-950/50" ref={trustedByRef}>
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <p className="text-center text-xs font-medium uppercase tracking-wide text-neutral-500 mb-8 scroll-animate">
            Trusted by luxury villa owners worldwide
          </p>
          <div className="flex flex-wrap justify-center items-center gap-8 md:gap-12">
            <div className="flex items-center gap-2 text-neutral-400 hover:text-neutral-300 transition-all duration-200 scroll-animate scroll-stagger-1 hover-scale-sm will-change-transform">
              <Globe className="h-4 w-4 icon-hover-rotate" />
              <span className="text-sm font-medium">Global reach</span>
            </div>
            <div className="flex items-center gap-2 text-neutral-400 hover:text-neutral-300 transition-all duration-200 scroll-animate scroll-stagger-2 hover-scale-sm will-change-transform">
              <Shield className="h-4 w-4 icon-hover-rotate" />
              <span className="text-sm font-medium">Secure platform</span>
            </div>
            <div className="flex items-center gap-2 text-neutral-400 hover:text-neutral-300 transition-all duration-200 scroll-animate scroll-stagger-3 hover-scale-sm will-change-transform">
              <Star className="h-4 w-4 icon-hover-rotate" />
              <span className="text-sm font-medium">5-star service</span>
            </div>
            <div className="flex items-center gap-2 text-neutral-400 hover:text-neutral-300 transition-all duration-200 scroll-animate scroll-stagger-4 hover-scale-sm will-change-transform">
              <Building className="h-4 w-4 icon-hover-rotate" />
              <span className="text-sm font-medium">Premium properties</span>
            </div>
            <div className="flex items-center gap-2 text-neutral-400 hover:text-neutral-300 transition-all duration-200 scroll-animate scroll-stagger-5 hover-scale-sm will-change-transform">
              <Users className="h-4 w-4 icon-hover-rotate" />
              <span className="text-sm font-medium">Expert support</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section - Linear dark card design with scroll animations */}
      <section id="features" className="py-24 sm:py-32 bg-black" ref={featuresRef}>
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl scroll-animate will-change-transform">
              Everything you need to manage your villas
            </h2>
            <p className="mt-4 text-lg leading-8 text-neutral-400 scroll-animate scroll-stagger-1 will-change-transform">
              Powerful tools designed for luxury villa property managers and owners who demand excellence.
            </p>
          </div>

          {/* Features Grid - Linear cards with scroll animations */}
          <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
            <div className="grid max-w-xl grid-cols-1 gap-6 lg:max-w-none lg:grid-cols-2 xl:grid-cols-4">
              <Card className="group hover:shadow-xl transition-all duration-300 hover-lift bg-neutral-950 border-neutral-800 hover:border-neutral-700 scroll-animate-scale scroll-stagger-1 will-change-transform">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-neutral-900 border border-neutral-800 group-hover:bg-neutral-800 transition-colors duration-200">
                      <Building className="h-5 w-5 text-neutral-300 group-hover:text-white transition-colors duration-200" />
                    </div>
                    <h3 className="font-semibold text-white">Property Management</h3>
                  </div>
                  <p className="text-sm leading-6 text-neutral-400 group-hover:text-neutral-300 transition-colors duration-200">
                    Manage multiple luxury villa properties with detailed information, stunning photos, and comprehensive amenity listings.
                  </p>
                </CardContent>
              </Card>

              <Card className="group hover:shadow-xl transition-all duration-300 hover-lift bg-neutral-950 border-neutral-800 hover:border-neutral-700 scroll-animate-scale scroll-stagger-2 will-change-transform">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-neutral-900 border border-neutral-800 group-hover:bg-neutral-800 transition-colors duration-200">
                      <Calendar className="h-5 w-5 text-neutral-300 group-hover:text-white transition-colors duration-200" />
                    </div>
                    <h3 className="font-semibold text-white">Smart Booking</h3>
                  </div>
                  <p className="text-sm leading-6 text-neutral-400 group-hover:text-neutral-300 transition-colors duration-200">
                    Handle reservations, availability, and guest communications with our intelligent booking platform.
                  </p>
                </CardContent>
              </Card>

              <Card className="group hover:shadow-xl transition-all duration-300 hover-lift bg-neutral-950 border-neutral-800 hover:border-neutral-700 scroll-animate-scale scroll-stagger-3 will-change-transform">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-neutral-900 border border-neutral-800 group-hover:bg-neutral-800 transition-colors duration-200">
                      <Users className="h-5 w-5 text-neutral-300 group-hover:text-white transition-colors duration-200" />
                    </div>
                    <h3 className="font-semibold text-white">Staff Coordination</h3>
                  </div>
                  <p className="text-sm leading-6 text-neutral-400 group-hover:text-neutral-300 transition-colors duration-200">
                    Coordinate with your team and assign tasks for property maintenance and exceptional guest services.
                  </p>
                </CardContent>
              </Card>

              <Card className="group hover:shadow-xl transition-all duration-300 hover-lift bg-neutral-950 border-neutral-800 hover:border-neutral-700 scroll-animate-scale scroll-stagger-4 will-change-transform">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-neutral-900 border border-neutral-800 group-hover:bg-neutral-800 transition-colors duration-200">
                      <BarChart3 className="h-5 w-5 text-neutral-300 group-hover:text-white transition-colors duration-200" />
                    </div>
                    <h3 className="font-semibold text-white">Advanced Analytics</h3>
                  </div>
                  <p className="text-sm leading-6 text-neutral-400 group-hover:text-neutral-300 transition-colors duration-200">
                    Track performance, revenue, and occupancy rates with detailed analytics and actionable insights.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section - Linear style with scroll animations */}
      <section id="benefits" className="bg-neutral-950/50 py-24 sm:py-32" ref={benefitsRef}>
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-sm font-semibold leading-7 text-primary-400 scroll-animate will-change-transform">Why choose Sia Moon</h2>
            <p className="mt-2 text-3xl font-semibold tracking-tight text-white sm:text-4xl scroll-animate scroll-stagger-1 will-change-transform">
              Built for luxury villa excellence
            </p>
            <p className="mt-4 text-lg leading-8 text-neutral-400 scroll-animate scroll-stagger-2 will-change-transform">
              We understand the unique challenges of managing luxury properties. Our platform is designed specifically for high-end villa operations.
            </p>
          </div>

          <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
            <div className="grid max-w-xl grid-cols-1 gap-6 lg:max-w-none lg:grid-cols-2">
              <Card className="group hover:shadow-xl transition-all duration-300 hover-lift bg-neutral-950 border-neutral-800 hover:border-neutral-700 animate-stagger-fade-in animate-delay-75 will-change-transform">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-neutral-900 border border-neutral-800 group-hover:bg-neutral-800 transition-colors duration-200 flex-shrink-0">
                      <CheckCircle className="h-5 w-5 text-neutral-300 group-hover:text-white transition-colors duration-200" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white mb-2">24/7 Premium Support</h3>
                      <p className="text-sm leading-6 text-neutral-400 group-hover:text-neutral-300 transition-colors duration-200">
                        Round-the-clock support for you and your guests, ensuring seamless operations at all times.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="group hover:shadow-xl transition-all duration-300 hover-lift bg-neutral-950 border-neutral-800 hover:border-neutral-700 animate-stagger-fade-in animate-delay-150 will-change-transform">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-neutral-900 border border-neutral-800 group-hover:bg-neutral-800 transition-colors duration-200 flex-shrink-0">
                      <Globe className="h-5 w-5 text-neutral-300 group-hover:text-white transition-colors duration-200" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white mb-2">Global Accessibility</h3>
                      <p className="text-sm leading-6 text-neutral-400 group-hover:text-neutral-300 transition-colors duration-200">
                        Access your villa management platform from anywhere in the world with full mobile optimization.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="group hover:shadow-xl transition-all duration-300 hover-lift bg-neutral-950 border-neutral-800 hover:border-neutral-700 animate-stagger-fade-in animate-delay-225 will-change-transform">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-neutral-900 border border-neutral-800 group-hover:bg-neutral-800 transition-colors duration-200 flex-shrink-0">
                      <Shield className="h-5 w-5 text-neutral-300 group-hover:text-white transition-colors duration-200" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white mb-2">Enterprise Security</h3>
                      <p className="text-sm leading-6 text-neutral-400 group-hover:text-neutral-300 transition-colors duration-200">
                        Bank-level security with encrypted data storage and secure payment processing for peace of mind.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="group hover:shadow-xl transition-all duration-300 hover-lift bg-neutral-950 border-neutral-800 hover:border-neutral-700 animate-stagger-fade-in animate-delay-300 will-change-transform">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-neutral-900 border border-neutral-800 group-hover:bg-neutral-800 transition-colors duration-200 flex-shrink-0">
                      <Star className="h-5 w-5 text-neutral-300 group-hover:text-white transition-colors duration-200" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white mb-2">Luxury Focus</h3>
                      <p className="text-sm leading-6 text-neutral-400 group-hover:text-neutral-300 transition-colors duration-200">
                        Purpose-built for luxury villa operations with features that cater to high-end guest expectations.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom CTA Section - Linear style with scroll animations */}
      <section className="bg-black py-24 sm:py-32" ref={ctaRef}>
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl scroll-animate will-change-transform">
              Ready to transform your villa management?
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-lg leading-8 text-neutral-400 scroll-animate scroll-stagger-1 will-change-transform">
              Join luxury villa owners who trust our platform to maximize their revenue and deliver exceptional guest experiences.
            </p>

            <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:justify-center scroll-animate scroll-stagger-2">
              <Link href="/auth/signup" className="group">
                <Button
                  size="lg"
                  className="h-12 px-8 text-sm font-medium bg-white text-black hover:bg-neutral-100 transition-all duration-200 btn-hover-lift will-change-transform"
                >
                  Get started today
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1 icon-hover" />
                </Button>
              </Link>
              <Link href="/onboard-simple">
                <Button
                  variant="outline"
                  size="lg"
                  className="h-12 px-8 text-sm font-medium border-neutral-600 text-neutral-300 hover:bg-neutral-900 hover:border-neutral-500 hover:text-white transition-all duration-200 btn-hover-scale will-change-transform"
                >
                  Get villa management quote
                </Button>
              </Link>
            </div>

            {/* Trust indicators with scroll animations */}
            <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-6 text-sm text-neutral-500">
              <div className="flex items-center gap-2 scroll-animate scroll-stagger-3 hover-scale-sm will-change-transform">
                <CheckCircle className="h-4 w-4 text-neutral-400" />
                <span>No setup fees</span>
              </div>
              <div className="flex items-center gap-2 scroll-animate scroll-stagger-4 hover-scale-sm will-change-transform">
                <CheckCircle className="h-4 w-4 text-neutral-400" />
                <span>24/7 premium support</span>
              </div>
              <div className="flex items-center gap-2 scroll-animate scroll-stagger-5 hover-scale-sm will-change-transform">
                <CheckCircle className="h-4 w-4 text-neutral-400" />
                <span>Cancel anytime</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}