# Villa Property Management - Mobile App Brand Guide

**Claude 4 Prompt for Mobile App Development**

---

## 🎯 Brand Identity & Design System Overview

I need you to create a mobile app that perfectly matches the brand identity and design system of my existing Villa Property Management web application. Here's the complete brand guide:

## 🎨 **Core Brand Identity**

### **Design Philosophy**
- **Inspiration**: Linear app + Augment design system
- **Theme**: Dark-first, premium, professional
- **Target**: High-end property management for luxury villas
- **Personality**: Sophisticated, modern, trustworthy, premium

### **Visual Style**
- **Dark theme by default** with sophisticated gradients
- **Minimalist** with purposeful use of white space
- **Premium feel** with subtle animations and micro-interactions
- **Professional** but approachable interface

---

## 🌈 **Color System**

### **Primary Colors**
```css
Primary Purple: #8b5cf6 (Linear's signature purple)
Primary Hover: #7c3aed
Primary Dark: #6d28d9
Primary Light: #a78bfa
```

### **Grayscale (Dark-first)**
```css
Pure Black: #000000
Background: #0a0a0a
Background Secondary: #111111
Background Tertiary: #1a1a1a
Card Background: #111111

Neutral 950: #0a0a0a
Neutral 900: #111111
Neutral 850: #1a1a1a
Neutral 800: #1f1f1f
Neutral 700: #2a2a2a
Neutral 600: #404040
Neutral 500: #525252
Neutral 400: #737373
Neutral 300: #a3a3a3
Neutral 200: #d4d4d4
Neutral 100: #e5e5e5
Neutral 50: #f5f5f5
White: #ffffff
```

### **Semantic Colors**
```css
Success: #22c55e
Warning: #f59e0b
Error: #ef4444
```

### **Borders**
```css
Border Default: #262626
Border Light: #333333
Border Strong: #404040
```

---

## 📱 **Typography System**

### **Font Family**
- **Primary**: Inter (Google Fonts)
- **Fallbacks**: -apple-system, BlinkMacSystemFont, SF Pro Display, SF Pro Text, Segoe UI, Roboto, Helvetica Neue, Arial, sans-serif

### **Font Settings** (iOS/Android implementation)
```css
Font Features: 'cv02', 'cv03', 'cv04', 'cv11'
Font Variant: tabular-nums
Font Smoothing: antialiased
Text Rendering: optimizeLegibility
Line Height: 1.5
Letter Spacing: -0.011em (tight, Linear-style)
```

### **Typography Scale**
```css
Text XS: 12px / Line Height 16px / Letter Spacing 0.025em
Text SM: 14px / Line Height 20px / Letter Spacing 0.025em
Text Base: 16px / Line Height 24px / Letter Spacing 0
Text LG: 18px / Line Height 28px / Letter Spacing -0.025em
Text XL: 20px / Line Height 28px / Letter Spacing -0.025em
Text 2XL: 24px / Line Height 32px / Letter Spacing -0.025em
Text 3XL: 30px / Line Height 36px / Letter Spacing -0.025em
Text 4XL: 36px / Line Height 40px / Letter Spacing -0.025em
Text 5XL: 48px / Line Height 1.1 / Letter Spacing -0.025em
```

---

## 🧱 **Component Design Patterns**

### **Buttons**
```css
Primary Button:
- Background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)
- Border: 1px solid rgba(139, 92, 246, 0.2)
- Border Radius: 8px
- Box Shadow: 0 2px 8px rgba(139, 92, 246, 0.2)
- Text: White
- Hover: Transform translateY(-1px) + enhanced shadow
- Active: Scale 0.98

Secondary Button:
- Background: #111111
- Border: 1px solid #262626
- Text: White
- Hover: Background #1a1a1a

Outline Button:
- Background: Transparent
- Border: 1px solid #404040
- Text: White
- Hover: Background #111111
```

### **Cards**
```css
Background: #111111
Border: 1px solid #262626
Border Radius: 12px
Padding: 24px
Box Shadow: 0 4px 20px rgba(0, 0, 0, 0.3)
Hover: Transform translateY(-2px) + enhanced shadow
```

### **Inputs**
```css
Background: #1a1a1a
Border: 1px solid #262626
Border Radius: 8px
Text: White
Placeholder: #737373
Focus: Border #8b5cf6 + Box Shadow 0 0 0 2px rgba(139, 92, 246, 0.2)
Min Height: 44px (touch target)
```

---

## ✨ **Animation & Micro-interactions**

### **Animation Principles**
- **Subtle and purposeful** - never distracting
- **Linear-inspired easing**: cubic-bezier(0.25, 0.46, 0.45, 0.94)
- **Duration**: 200-300ms for micro-interactions, 500ms for page transitions
- **Hover effects**: Slight translateY(-2px) + enhanced shadows
- **Button presses**: Scale 0.98
- **Loading states**: Subtle shimmer animations

### **Common Animations**
```css
Fade In: opacity 0 → 1, duration 300ms
Slide Up: translateY(20px) → 0, duration 300ms
Scale In: scale(0.95) → 1, duration 200ms
Shimmer Loading: Background gradient animation
```

---

## 🏗️ **Layout & Spacing**

### **Spacing System** (8px base)
```css
Space 1: 4px
Space 2: 8px
Space 3: 12px
Space 4: 16px
Space 5: 20px
Space 6: 24px
Space 8: 32px
Space 10: 40px
Space 12: 48px
Space 16: 64px
Space 20: 80px
Space 24: 96px
```

### **Safe Areas** (Mobile specific)
```css
Safe Area Top: env(safe-area-inset-top)
Safe Area Bottom: env(safe-area-inset-bottom)
Safe Area Left: env(safe-area-inset-left)
Safe Area Right: env(safe-area-inset-right)
```

### **Touch Targets**
- **Minimum**: 44px x 44px
- **Recommended**: 48px x 48px for primary actions
- **Spacing**: 8px minimum between touch targets

---

## 🖼️ **Visual Elements**

### **Gradients**
```css
Primary Gradient: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)
Background Gradient: linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%)
Card Gradient: linear-gradient(135deg, #111111 0%, #1a1a1a 100%)
Text Gradient: linear-gradient(to right, #ffffff 0%, #a3a3a3 80%, transparent 100%)
```

### **Shadows**
```css
Card Shadow: 0 4px 20px rgba(0, 0, 0, 0.3)
Button Shadow: 0 2px 8px rgba(139, 92, 246, 0.2)
Elevated Shadow: 0 8px 30px rgba(0, 0, 0, 0.4)
Focus Shadow: 0 0 0 2px rgba(139, 92, 246, 0.2)
```

### **Border Radius**
```css
Small: 4px
Default: 8px
Medium: 12px
Large: 16px
XL: 24px
Full: 9999px (pills)
```

---

## 📐 **Component Specifications**

### **Navigation**
- **Bottom Tab Bar**: Dark (#111111) with purple accent for active state
- **Top Navigation**: Minimal with back button, title, and optional action
- **Height**: 54px for tab bar, 44px + safe area for top nav

### **Lists & Cards**
- **Background**: #111111
- **Separator**: 1px solid #262626
- **Padding**: 16px horizontal, 12px vertical
- **Touch feedback**: Subtle background change to #1a1a1a

### **Modals & Sheets**
- **Background**: #111111
- **Backdrop**: rgba(0, 0, 0, 0.5)
- **Border Radius**: 16px (top corners for sheets)
- **Handle**: 4px x 32px rounded pill in #404040

---

## 📱 **Platform-Specific Considerations**

### **iOS**
- Use SF Pro Display/Text when Inter isn't available
- Respect system haptic feedback
- Follow iOS navigation patterns
- Support dark mode system setting
- Use iOS-style switches and pickers

### **Android**
- Use Roboto when Inter isn't available
- Material Design 3 ripple effects with dark theme
- Android-style navigation
- Respect system dark mode
- Use Android-style switches and pickers

---

## 🎯 **Brand Voice & Content**

### **Tone**
- **Professional** but approachable
- **Confident** without being arrogant
- **Helpful** and solution-focused
- **Premium** without being pretentious

### **Key Features to Highlight**
- Property management automation
- Booking optimization
- Maintenance tracking
- Financial reporting
- Guest communication
- Multi-property support

---

## 🖼️ **Image & Media Guidelines**

### **Photography Style**
- **High-quality** luxury villa photography
- **Consistent filtering**: Slight desaturation with enhanced contrast
- **Aspect Ratios**: 16:9 for hero images, 1:1 for property thumbnails
- **Overlay**: Dark gradient overlays for text readability

### **Icons**
- **Style**: Lucide React icon set (outline style)
- **Size**: 16px, 20px, 24px standard sizes
- **Color**: White (#ffffff) primary, #a3a3a3 secondary
- **Weight**: 1.5px stroke weight

---

## ⚡ **Performance & Accessibility**

### **Performance**
- **Image optimization**: WebP format with fallbacks
- **Lazy loading**: For non-critical images
- **Smooth animations**: 60fps target
- **Fast transitions**: <300ms page transitions

### **Accessibility**
- **High contrast**: Ensure 4.5:1 contrast ratio minimum
- **Touch targets**: 44px minimum
- **Screen reader support**: Proper labels and hints
- **Focus indicators**: Clear purple outline (#8b5cf6)

---

## 🎨 **Design Examples from Web App**

### **Hero Section Style**
- Dark background with subtle luxury villa image (low opacity)
- Gradient overlay: `from-black/90 via-black/65 to-transparent`
- Large typography with gradient text effects
- Premium call-to-action buttons with glow effects

### **Card Layouts**
- Dark cards (#111111) with subtle borders (#262626)
- Hover effects with shadow and slight elevation
- Consistent padding and border radius
- Gradient accents for interactive elements

### **Form Elements**
- Dark inputs with focused purple accents
- Consistent spacing and typography
- Clear error states with red semantic colors
- Success states with green semantic colors

---

## 🔄 **Implementation Notes**

When creating the mobile app, ensure:
1. **Pixel-perfect adherence** to this color system
2. **Consistent spacing** using the 8px grid system  
3. **Smooth animations** that feel premium but not overdone
4. **Touch-friendly** interfaces with proper spacing
5. **Dark theme first** approach with option for system setting
6. **Professional typography** with tight letter spacing
7. **Subtle gradients** and shadows for depth
8. **Consistent icon usage** from Lucide set
9. **Accessibility compliance** for enterprise users
10. **Performance optimization** for smooth interactions

This mobile app should feel like a **native mobile extension** of the web application, maintaining the same premium, professional aesthetic while being perfectly optimized for mobile interaction patterns and platform conventions.
