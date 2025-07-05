# Cloudinary Setup Guide

This guide explains how to set up Cloudinary for image management in your Villa Management application.

## 🚀 Quick Setup

### 1. Create a Cloudinary Account
1. Go to [cloudinary.com](https://cloudinary.com) and sign up for a free account
2. After signing up, you'll be taken to your dashboard
3. Note down your **Cloud Name**, **API Key**, and **API Secret**

### 2. Configure Environment Variables
Add these variables to your `.env.local` file:

```bash
# Cloudinary Configuration
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name_here
CLOUDINARY_API_KEY=your_api_key_here
CLOUDINARY_API_SECRET=your_api_secret_here
```

Replace the placeholder values with your actual Cloudinary credentials.

### 3. Create an Upload Preset (Optional)
For unsigned uploads, create an upload preset in your Cloudinary dashboard:

1. Go to Settings → Upload
2. Scroll down to "Upload presets"
3. Click "Add upload preset"
4. Set the preset name to `villa_management_unsigned`
5. Set signing mode to "Unsigned"
6. Configure any transformations you want applied automatically

## 📁 File Structure

The Cloudinary integration includes these files:

```
src/
├── lib/
│   ├── cloudinary.ts              # Server-side Cloudinary config
│   └── cloudinary-upload.ts       # Client-side upload utilities
├── components/ui/
│   ├── CloudinaryImage.tsx        # Optimized image component
│   └── ImageUpload.tsx            # File upload component
└── app/api/cloudinary/
    ├── delete/route.ts            # Delete images API
    └── signature/route.ts         # Generate upload signatures
```

## 🖼️ Using CloudinaryImage Component

The `CloudinaryImage` component provides optimized image loading with automatic WebP conversion and responsive sizing:

```tsx
import CloudinaryImage from '@/components/ui/CloudinaryImage'

// Basic usage
<CloudinaryImage
  publicId="your-image-id"
  alt="Description"
  width={800}
  height={600}
/>

// With opacity (like the hero image)
<CloudinaryImage
  publicId="e36eb55c-9c04-4d51-b1aa-8ce78e49ec97_s5opqn"
  alt="Villa hero background"
  fill
  priority
  opacity={50}
  className="object-cover"
/>

// Responsive image
<CloudinaryImage
  publicId="your-image-id"
  alt="Description"
  fill
  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
/>
```

## 📤 Using ImageUpload Component

The `ImageUpload` component provides drag-and-drop file uploads:

```tsx
import ImageUpload from '@/components/ui/ImageUpload'

<ImageUpload
  onUpload={(result) => {
    console.log('Uploaded:', result.public_id)
    // Save the public_id to your database
  }}
  onRemove={() => {
    // Handle image removal
  }}
  currentImage="existing-image-id" // Optional
  folder="properties" // Optional: organize uploads
/>
```

## 🔧 Image Transformations

Cloudinary automatically applies these optimizations:

- **Format**: Converts to WebP for better compression
- **Quality**: Auto-optimized based on content
- **Responsive**: Multiple sizes generated automatically
- **Lazy Loading**: Built-in with Next.js Image component

### Custom Transformations

You can apply custom transformations:

```tsx
<CloudinaryImage
  publicId="your-image-id"
  alt="Description"
  width={800}
  height={600}
  transformation={['e_blur:300', 'e_grayscale']} // Blur and grayscale
  crop="thumb"
  gravity="face" // Focus on faces when cropping
/>
```

## 🌐 URL Structure

Cloudinary URLs follow this pattern:
```
https://res.cloudinary.com/{cloud_name}/image/upload/{transformations}/{public_id}
```

Example with transformations:
```
https://res.cloudinary.com/demo/image/upload/w_800,h_600,c_fill,q_auto,f_webp,o_50/sample
```

## 🔒 Security

- **Server-side operations**: Image deletion and signed uploads use API secrets
- **Client-side operations**: Display and unsigned uploads use public credentials
- **Upload presets**: Control what transformations and settings are allowed

## 📊 Benefits

1. **Performance**: Automatic WebP conversion and optimization
2. **Responsive**: Multiple image sizes generated automatically
3. **CDN**: Global content delivery network for fast loading
4. **Transformations**: Real-time image processing
5. **Storage**: Reliable cloud storage with backup
6. **Analytics**: Usage statistics and optimization insights

## 🚨 Current Status

The integration is set up and ready to use. To activate:

1. Add your Cloudinary credentials to `.env.local`
2. The hero image will automatically load from Cloudinary
3. Upload components are ready for property images
4. All transformations and optimizations are configured

## 🔄 Migration from Local Images

To migrate existing local images to Cloudinary:

1. Upload images to Cloudinary (manually or via API)
2. Note the `public_id` for each image
3. Replace local image paths with `CloudinaryImage` components
4. Update your database to store Cloudinary public IDs instead of file paths

## 📞 Support

- [Cloudinary Documentation](https://cloudinary.com/documentation)
- [Next.js Image Optimization](https://nextjs.org/docs/basic-features/image-optimization)
- [Cloudinary React SDK](https://cloudinary.com/documentation/react_integration)
