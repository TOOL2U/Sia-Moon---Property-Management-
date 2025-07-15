'use client'

import HeroSlideshow from '@/components/ui/HeroSlideshow'

export default function SlideshowDemo() {
  // Hero slideshow configuration
  const heroSlides = [
    {
      id: 'original-hero',
      publicId: 'e36eb55c-9c04-4d51-b1aa-8ce78e49ec97_s5opqn',
      alt: 'Luxury villa hero background - Original',
      title: 'Sia Moon Property Management',
      subtitle: 'Your original luxury villa experience'
    },
    {
      id: 'prestige-golfshire',
      externalUrl: 'https://res.cloudinary.com/prd-lifullconnect-projects-admin-images/image/upload/v1/67db8100-e621-11eb-8507-adcec962bfcd/Prestige-Golfshire-Villa-1_pf6ibk.jpg',
      alt: 'Prestige Golfshire Villa - Luxury property management',
      title: 'Prestige Golfshire Villa',
      subtitle: 'Exceptional luxury in every detail'
    },
    {
      id: 'luxury-villa-2',
      externalUrl: 'https://res.cloudinary.com/prd-lifullconnect-projects-admin-images/image/upload/v1/67db8100-e621-11eb-8507-adcec962bfcd/67c10c2-e23b-4250-9aae-9d2ec6aa5bb4.jpg',
      alt: 'Modern luxury villa - Premium property management',
      title: 'Modern Luxury Villa',
      subtitle: 'Contemporary elegance meets comfort'
    },
    {
      id: 'luxury-villa-3',
      externalUrl: 'https://res.cloudinary.com/prd-lifullconnect-projects-admin-images/image/upload/v1/0f3eb402-960a-4a07-869c-a8863770660f.jpg',
      alt: 'Elegant villa exterior - Professional property services',
      title: 'Elegant Villa Exterior',
      subtitle: 'Professional property services you can trust'
    }
  ]

  return (
    <div className="min-h-screen bg-black">
      {/* Demo Header */}
      <div className="relative z-10 p-6 bg-black/80 backdrop-blur-sm">
        <h1 className="text-white text-2xl font-bold mb-2">Hero Slideshow Demo</h1>
        <p className="text-gray-300 text-sm">
          Automatic slideshow with 6-second intervals • 4 slides total • Smooth fade transitions
        </p>
      </div>

      {/* Slideshow Container */}
      <div className="relative h-screen">
        <HeroSlideshow
          slides={heroSlides}
          autoPlayInterval={6000}
          showDots={true}
          showArrows={true}
          className="w-full h-full"
        />
        
        {/* Demo Controls Overlay */}
        <div className="absolute bottom-20 left-6 z-20 bg-black/60 backdrop-blur-sm rounded-lg p-4 text-white">
          <h3 className="font-semibold mb-2">Slideshow Features:</h3>
          <ul className="text-sm space-y-1">
            <li>✅ Auto-advance every 6 seconds</li>
            <li>✅ Smooth fade transitions</li>
            <li>✅ Dot navigation indicators</li>
            <li>✅ Arrow navigation controls</li>
            <li>✅ Pause on hover</li>
            <li>✅ Progress bar animation</li>
            <li>✅ Responsive design</li>
            <li>✅ Mixed Cloudinary + External URLs</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
