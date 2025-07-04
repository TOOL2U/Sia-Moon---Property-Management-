'use client';

import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import { Building, Users, Calendar, BarChart3, ArrowRight, Star, CheckCircle, Shield, Globe } from 'lucide-react'

export default function Home() {
  return (
    <div className="min-h-screen bg-black">
      {/* Hero Section - Linear-inspired dark design */}
      <section className="relative overflow-hidden">
        {/* Dark gradient background */}
        <div className="absolute inset-0 bg-gradient-to-b from-black via-neutral-950 to-neutral-900"></div>

        {/* Subtle dot pattern for depth */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgb(255_255_255_/_0.03)_1px,transparent_0)] [background-size:24px_24px]"></div>

        <div className="relative mx-auto max-w-7xl px-6 py-20 sm:py-32 lg:px-8">
          <div className="mx-auto max-w-4xl text-center">
            {/* Linear-style headline */}
            <h1 className="text-4xl font-semibold tracking-tight text-white sm:text-5xl lg:text-6xl animate-fade-in">
              Premium villa management
              <span className="block text-primary-400 bg-gradient-to-r from-primary-400 to-primary-300 bg-clip-text text-transparent">
                made simple
              </span>
            </h1>

            {/* Clean subtitle */}
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-neutral-300 animate-slide-in-bottom">
              Transform your luxury villa operations with our comprehensive platform.
              Manage bookings, coordinate staff, and delight guests while maximizing revenue.
            </p>

            {/* Linear-style CTA buttons */}
            <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:justify-center animate-slide-in-bottom">
              <Link href="/auth/signup" className="group">
                <Button
                  size="lg"
                  className="h-12 px-8 text-sm font-medium btn-premium"
                >
                  Get started
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </Button>
              </Link>
              <Link href="/auth/login">
                <Button
                  variant="outline"
                  size="lg"
                  className="h-12 px-8 text-sm font-medium border-neutral-700 text-neutral-300 hover:bg-neutral-900 hover:border-neutral-600 hover:text-white transition-all duration-200"
                >
                  Sign in
                </Button>
              </Link>
            </div>

            {/* Trust indicators - Linear dark style */}
            <div className="mt-16 grid grid-cols-3 gap-8 sm:gap-12 animate-fade-in">
              <div className="text-center">
                <div className="text-2xl font-semibold text-white">50+</div>
                <div className="text-sm text-neutral-400">Luxury villas</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-semibold text-white">1000+</div>
                <div className="text-sm text-neutral-400">Happy guests</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-semibold text-white">24/7</div>
                <div className="text-sm text-neutral-400">Support</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trusted By Section - Linear dark style */}
      <section className="py-16 border-y border-neutral-800 bg-neutral-950/50">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <p className="text-center text-xs font-medium uppercase tracking-wide text-neutral-500 mb-8">
            Trusted by luxury villa owners worldwide
          </p>
          <div className="flex flex-wrap justify-center items-center gap-8 md:gap-12">
            <div className="flex items-center gap-2 text-neutral-400 hover:text-neutral-300 transition-colors duration-200">
              <Globe className="h-4 w-4" />
              <span className="text-sm font-medium">Global reach</span>
            </div>
            <div className="flex items-center gap-2 text-neutral-400 hover:text-neutral-300 transition-colors duration-200">
              <Shield className="h-4 w-4" />
              <span className="text-sm font-medium">Secure platform</span>
            </div>
            <div className="flex items-center gap-2 text-neutral-400 hover:text-neutral-300 transition-colors duration-200">
              <Star className="h-4 w-4" />
              <span className="text-sm font-medium">5-star service</span>
            </div>
            <div className="flex items-center gap-2 text-neutral-400 hover:text-neutral-300 transition-colors duration-200">
              <Building className="h-4 w-4" />
              <span className="text-sm font-medium">Premium properties</span>
            </div>
            <div className="flex items-center gap-2 text-neutral-400 hover:text-neutral-300 transition-colors duration-200">
              <Users className="h-4 w-4" />
              <span className="text-sm font-medium">Expert support</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section - Linear dark card design */}
      <section className="py-24 sm:py-32 bg-black">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              Everything you need to manage your villas
            </h2>
            <p className="mt-4 text-lg leading-8 text-neutral-400">
              Powerful tools designed for luxury villa property managers and owners who demand excellence.
            </p>
          </div>

          {/* Features Grid - Linear cards */}
          <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
            <div className="grid max-w-xl grid-cols-1 gap-6 lg:max-w-none lg:grid-cols-2 xl:grid-cols-4">
              <Card className="group hover:shadow-xl transition-all duration-300 card-hover bg-neutral-950 border-neutral-800 hover:border-neutral-700">
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

              <Card className="group hover:shadow-xl transition-all duration-300 card-hover bg-neutral-950 border-neutral-800 hover:border-neutral-700">
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

              <Card className="group hover:shadow-xl transition-all duration-300 card-hover bg-neutral-950 border-neutral-800 hover:border-neutral-700">
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

              <Card className="group hover:shadow-xl transition-all duration-300 card-hover bg-neutral-950 border-neutral-800 hover:border-neutral-700">
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

      {/* Benefits Section - Linear style */}
      <section className="bg-neutral-950/50 py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-sm font-semibold leading-7 text-primary-400">Why choose Sia Moon</h2>
            <p className="mt-2 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              Built for luxury villa excellence
            </p>
            <p className="mt-4 text-lg leading-8 text-neutral-400">
              We understand the unique challenges of managing luxury properties. Our platform is designed specifically for high-end villa operations.
            </p>
          </div>

          <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
            <div className="grid max-w-xl grid-cols-1 gap-6 lg:max-w-none lg:grid-cols-2">
              <Card className="group hover:shadow-xl transition-all duration-300 card-hover bg-neutral-950 border-neutral-800 hover:border-neutral-700">
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

              <Card className="group hover:shadow-xl transition-all duration-300 card-hover bg-neutral-950 border-neutral-800 hover:border-neutral-700">
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

              <Card className="group hover:shadow-xl transition-all duration-300 card-hover bg-neutral-950 border-neutral-800 hover:border-neutral-700">
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

              <Card className="group hover:shadow-xl transition-all duration-300 card-hover bg-neutral-950 border-neutral-800 hover:border-neutral-700">
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

      {/* Bottom CTA Section - Linear style */}
      <section className="bg-black py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              Ready to transform your villa management?
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-lg leading-8 text-neutral-400">
              Join luxury villa owners who trust our platform to maximize their revenue and deliver exceptional guest experiences.
            </p>

            <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Link href="/auth/signup" className="group">
                <Button
                  size="lg"
                  className="h-12 px-8 text-sm font-medium bg-white text-black hover:bg-neutral-100 transition-all duration-200"
                >
                  Get started today
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </Button>
              </Link>
              <Link href="/onboard">
                <Button
                  variant="outline"
                  size="lg"
                  className="h-12 px-8 text-sm font-medium border-neutral-600 text-neutral-300 hover:bg-neutral-900 hover:border-neutral-500 hover:text-white transition-all duration-200"
                >
                  Onboard your villa
                </Button>
              </Link>
            </div>

            {/* Trust indicators - Linear style */}
            <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-6 text-sm text-neutral-500">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-neutral-400" />
                <span>No setup fees</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-neutral-400" />
                <span>24/7 premium support</span>
              </div>
              <div className="flex items-center gap-2">
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