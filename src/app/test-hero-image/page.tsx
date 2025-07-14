'use client'

import React from 'react'
import Image from 'next/image'
import CloudinaryImage from '@/components/ui/CloudinaryImage'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'

export default function TestHeroImagePage() {
  const publicId = "e36eb55c-9c04-4d51-b1aa-8ce78e49ec97_s5opqn"
  
  return (
    <div className="min-h-screen bg-black p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        <Card className="bg-neutral-900 border-neutral-800">
          <CardHeader>
            <CardTitle className="text-white">Hero Image Test</CardTitle>
            <CardDescription className="text-neutral-400">
              Testing the hero image with different approaches
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            
            {/* Test 1: Simple Cloudinary URL */}
            <div>
              <h3 className="text-white font-semibold mb-3">Test 1: Simple Cloudinary URL</h3>
              <div className="relative h-64 bg-neutral-800 rounded-lg overflow-hidden">
                <Image
                  src="https://res.cloudinary.com/doez7m1hy/image/upload/e36eb55c-9c04-4d51-b1aa-8ce78e49ec97_s5opqn"
                  alt="Hero image - Simple URL"
                  fill
                  priority
                  className="object-cover"
                  sizes="100vw"
                  onLoad={() => console.log('✅ Test 1: Simple URL loaded')}
                  onError={(e) => console.error('❌ Test 1: Simple URL failed:', e)}
                />
              </div>
              <p className="text-sm text-neutral-400 mt-2">
                URL: https://res.cloudinary.com/doez7m1hy/image/upload/{publicId}
              </p>
            </div>

            {/* Test 2: With basic transformations */}
            <div>
              <h3 className="text-white font-semibold mb-3">Test 2: With Basic Transformations</h3>
              <div className="relative h-64 bg-neutral-800 rounded-lg overflow-hidden">
                <Image
                  src="https://res.cloudinary.com/doez7m1hy/image/upload/c_fill,w_1920,h_1080/e36eb55c-9c04-4d51-b1aa-8ce78e49ec97_s5opqn"
                  alt="Hero image - Basic transformations"
                  fill
                  priority
                  className="object-cover"
                  sizes="100vw"
                  onLoad={() => console.log('✅ Test 2: Basic transformations loaded')}
                  onError={(e) => console.error('❌ Test 2: Basic transformations failed:', e)}
                />
              </div>
              <p className="text-sm text-neutral-400 mt-2">
                URL: https://res.cloudinary.com/doez7m1hy/image/upload/c_fill,w_1920,h_1080/{publicId}
              </p>
            </div>

            {/* Test 3: With WebP format */}
            <div>
              <h3 className="text-white font-semibold mb-3">Test 3: With WebP Format</h3>
              <div className="relative h-64 bg-neutral-800 rounded-lg overflow-hidden">
                <Image
                  src="https://res.cloudinary.com/doez7m1hy/image/upload/f_webp,c_fill,w_1920,h_1080/e36eb55c-9c04-4d51-b1aa-8ce78e49ec97_s5opqn"
                  alt="Hero image - WebP format"
                  fill
                  priority
                  className="object-cover"
                  sizes="100vw"
                  onLoad={() => console.log('✅ Test 3: WebP format loaded')}
                  onError={(e) => console.error('❌ Test 3: WebP format failed:', e)}
                />
              </div>
              <p className="text-sm text-neutral-400 mt-2">
                URL: https://res.cloudinary.com/doez7m1hy/image/upload/f_webp,c_fill,w_1920,h_1080/{publicId}
              </p>
            </div>

            {/* Test 4: Raw upload URL */}
            <div>
              <h3 className="text-white font-semibold mb-3">Test 4: Raw Upload URL</h3>
              <div className="relative h-64 bg-neutral-800 rounded-lg overflow-hidden">
                <Image
                  src="https://res.cloudinary.com/doez7m1hy/raw/upload/e36eb55c-9c04-4d51-b1aa-8ce78e49ec97_s5opqn"
                  alt="Hero image - Raw URL"
                  fill
                  priority
                  className="object-cover"
                  sizes="100vw"
                  onLoad={() => console.log('✅ Test 4: Raw URL loaded')}
                  onError={(e) => console.error('❌ Test 4: Raw URL failed:', e)}
                />
              </div>
              <p className="text-sm text-neutral-400 mt-2">
                URL: https://res.cloudinary.com/doez7m1hy/raw/upload/{publicId}
              </p>
            </div>

            {/* Direct Next.js Image without opacity */}
            <div>
              <h3 className="text-white font-semibold mb-3">Direct Next.js Image (No Opacity)</h3>
              <div className="relative h-64 bg-neutral-800 rounded-lg overflow-hidden">
                <Image
                  src="https://res.cloudinary.com/doez7m1hy/image/upload/c_fill,g_center,q_100,f_webp/e36eb55c-9c04-4d51-b1aa-8ce78e49ec97_s5opqn"
                  alt="Hero image - Direct URL no opacity"
                  fill
                  priority
                  className="object-cover"
                  sizes="100vw"
                  onLoad={() => console.log('✅ Direct image no opacity loaded')}
                  onError={(e) => console.error('❌ Direct image no opacity failed:', e)}
                />
              </div>
              <p className="text-sm text-neutral-400 mt-2">
                URL: https://res.cloudinary.com/doez7m1hy/image/upload/c_fill,g_center,q_100,f_webp/{publicId}
              </p>
            </div>

            {/* CloudinaryImage Component */}
            <div>
              <h3 className="text-white font-semibold mb-3">CloudinaryImage Component</h3>
              <div className="relative h-64 bg-neutral-800 rounded-lg overflow-hidden">
                <CloudinaryImage
                  publicId={publicId}
                  alt="Hero image - CloudinaryImage component"
                  fill
                  priority
                  opacity={12}
                  quality={100}
                  format="webp"
                  crop="fill"
                  gravity="center"
                  className="object-cover"
                  sizes="100vw"
                />
              </div>
              <p className="text-sm text-neutral-400 mt-2">
                Using CloudinaryImage component with opacity=12
              </p>
            </div>

            {/* Simple Cloudinary URL */}
            <div>
              <h3 className="text-white font-semibold mb-3">Simple Cloudinary URL</h3>
              <div className="relative h-64 bg-neutral-800 rounded-lg overflow-hidden">
                <Image
                  src={`https://res.cloudinary.com/doez7m1hy/image/upload/${publicId}`}
                  alt="Hero image - Simple URL"
                  fill
                  priority
                  className="object-cover"
                  sizes="100vw"
                  onLoad={() => console.log('✅ Simple URL loaded')}
                  onError={(e) => console.error('❌ Simple URL failed:', e)}
                />
              </div>
              <p className="text-sm text-neutral-400 mt-2">
                URL: https://res.cloudinary.com/doez7m1hy/image/upload/{publicId}
              </p>
            </div>

            {/* Test with different public ID */}
            <div>
              <h3 className="text-white font-semibold mb-3">Test with Sample Image</h3>
              <div className="relative h-64 bg-neutral-800 rounded-lg overflow-hidden">
                <Image
                  src="https://res.cloudinary.com/doez7m1hy/image/upload/c_fill,g_center,q_100,f_webp/sample"
                  alt="Sample image test"
                  fill
                  priority
                  className="object-cover"
                  sizes="100vw"
                  onLoad={() => console.log('✅ Sample image loaded')}
                  onError={(e) => console.error('❌ Sample image failed:', e)}
                />
              </div>
              <p className="text-sm text-neutral-400 mt-2">
                URL: https://res.cloudinary.com/doez7m1hy/image/upload/c_fill,g_center,q_100,f_webp/sample
              </p>
            </div>

            {/* Hero Section Replica */}
            <div>
              <h3 className="text-white font-semibold mb-3">Hero Section Replica</h3>
              <div className="relative h-96 bg-neutral-800 rounded-lg overflow-hidden">
                {/* Background Image */}
                <Image
                  src="https://res.cloudinary.com/doez7m1hy/image/upload/c_fill,g_center,q_100,f_webp,o_12/e36eb55c-9c04-4d51-b1aa-8ce78e49ec97_s5opqn"
                  alt="Hero background replica"
                  fill
                  priority
                  className="object-cover"
                  sizes="100vw"
                />
                
                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/65 to-transparent"></div>
                
                {/* Content */}
                <div className="relative h-full flex items-center justify-center">
                  <div className="text-center text-white">
                    <h1 className="text-4xl font-bold mb-4">Luxury Villa Management</h1>
                    <p className="text-xl opacity-90">Experience the difference</p>
                  </div>
                </div>
              </div>
              <p className="text-sm text-neutral-400 mt-2">
                Exact replica of homepage hero section
              </p>
            </div>

          </CardContent>
        </Card>
      </div>
    </div>
  )
}
