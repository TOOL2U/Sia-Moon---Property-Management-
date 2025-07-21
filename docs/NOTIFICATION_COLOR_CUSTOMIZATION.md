# 🎨 Notification Color Customization Guide

## Overview
This guide shows you how to customize the colors for both **banner notifications** (in-app toasts) and **push notifications** (FCM) in your Villa Management system.

## 🔔 Banner Notifications (In-App Toasts)

### Current Toast Colors
Located in: `src/components/ui/SimpleToast.tsx`

```typescript
// Current color scheme
const getBgColor = () => {
  switch (toast.type) {
    case 'success':
      return 'bg-green-900/20 border-green-500/30'  // ✅ Success: Green
    case 'error':
      return 'bg-red-900/20 border-red-500/30'      // ❌ Error: Red
    case 'loading':
      return 'bg-blue-900/20 border-blue-500/30'    // ⏳ Loading: Blue
    default:
      return 'bg-gray-900/20 border-gray-500/30'    // ℹ️ Info: Gray
  }
}
```

### ✨ Custom Color Options

#### Option 1: Modern Purple Theme
```typescript
const getBgColor = () => {
  switch (toast.type) {
    case 'success':
      return 'bg-purple-900/20 border-purple-500/30'  // 🎯 Job notifications: Purple
    case 'error':
      return 'bg-red-900/20 border-red-500/30'        // Keep red for errors
    case 'loading':
      return 'bg-indigo-900/20 border-indigo-500/30'  // Loading: Indigo
    default:
      return 'bg-slate-900/20 border-slate-500/30'    // Info: Slate
  }
}
```

#### Option 2: Ocean Blue Theme
```typescript
const getBgColor = () => {
  switch (toast.type) {
    case 'success':
      return 'bg-cyan-900/20 border-cyan-500/30'      // 🌊 Ocean cyan
    case 'error':
      return 'bg-rose-900/20 border-rose-500/30'      // Rose red
    case 'loading':
      return 'bg-blue-900/20 border-blue-500/30'      // Ocean blue
    default:
      return 'bg-slate-900/20 border-slate-500/30'    // Neutral slate
  }
}
```

#### Option 3: Warm Sunset Theme
```typescript
const getBgColor = () => {
  switch (toast.type) {
    case 'success':
      return 'bg-orange-900/20 border-orange-500/30'  // 🌅 Sunset orange
    case 'error':
      return 'bg-red-900/20 border-red-500/30'        // Keep red
    case 'loading':
      return 'bg-yellow-900/20 border-yellow-500/30'  // Warm yellow
    default:
      return 'bg-amber-900/20 border-amber-500/30'    // Amber
  }
}
```

#### Option 4: Job Assignment Specific Colors
```typescript
// Add job assignment specific styling
const getBgColor = () => {
  switch (toast.type) {
    case 'success':
      // Check if it's a job assignment notification
      if (toast.message.includes('Job') || toast.message.includes('Assignment')) {
        return 'bg-emerald-900/20 border-emerald-500/30'  // 🎯 Special job color
      }
      return 'bg-green-900/20 border-green-500/30'
    case 'error':
      return 'bg-red-900/20 border-red-500/30'
    case 'loading':
      return 'bg-blue-900/20 border-blue-500/30'
    default:
      return 'bg-gray-900/20 border-gray-500/30'
  }
}
```

### Icon Colors
Also update the icon colors to match:

```typescript
const getIcon = () => {
  switch (toast.type) {
    case 'success':
      return <CheckCircle className="w-5 h-5 text-purple-400" />  // Match your theme
    case 'error':
      return <AlertCircle className="w-5 h-5 text-red-400" />
    case 'loading':
      return <Loader2 className="w-5 h-5 text-indigo-400 animate-spin" />
    default:
      return <Info className="w-5 h-5 text-slate-400" />
  }
}
```

## 📱 Push Notifications (FCM)

### Current Push Notification Colors
Located in: `functions/src/jobNotifications.ts`

```typescript
android: {
  notification: {
    icon: 'ic_notification',
    color: '#6366f1', // Current: Indigo (#6366f1)
    channelId: 'job_assignments',
    priority: notificationData.priority === 'urgent' ? 'high' : 'default',
    sound: 'default',
  },
}
```

### ✨ Custom Push Notification Colors

#### Option 1: Purple Theme (Matches banner)
```typescript
android: {
  notification: {
    icon: 'ic_notification',
    color: '#8b5cf6', // Purple (#8b5cf6)
    channelId: 'job_assignments',
    priority: notificationData.priority === 'urgent' ? 'high' : 'default',
    sound: 'default',
  },
}
```

#### Option 2: Ocean Blue Theme
```typescript
android: {
  notification: {
    icon: 'ic_notification',
    color: '#06b6d4', // Cyan (#06b6d4)
    channelId: 'job_assignments',
    priority: notificationData.priority === 'urgent' ? 'high' : 'default',
    sound: 'default',
  },
}
```

#### Option 3: Warm Orange Theme
```typescript
android: {
  notification: {
    icon: 'ic_notification',
    color: '#f97316', // Orange (#f97316)
    channelId: 'job_assignments',
    priority: notificationData.priority === 'urgent' ? 'high' : 'default',
    sound: 'default',
  },
}
```

#### Option 4: Dynamic Colors Based on Priority
```typescript
const getNotificationColor = (priority: string) => {
  switch (priority) {
    case 'urgent': return '#ef4444'   // Red for urgent
    case 'high': return '#f97316'     // Orange for high
    case 'medium': return '#8b5cf6'   // Purple for medium
    case 'low': return '#06b6d4'      // Cyan for low
    default: return '#6366f1'         // Default indigo
  }
}

// Then use it in the notification:
android: {
  notification: {
    icon: 'ic_notification',
    color: getNotificationColor(notificationData.priority),
    channelId: 'job_assignments',
    priority: notificationData.priority === 'urgent' ? 'high' : 'default',
    sound: 'default',
  },
}
```

## 🏢 Notification Center Colors

### Current Notification Center
Located in: `src/components/notifications/NotificationCenter.tsx`

```typescript
// Current priority badge colors
const getPriorityBadge = (priority: string) => {
  switch (priority) {
    case 'urgent':
      return <Badge className="bg-red-500/10 text-red-400 border-red-500/20">Urgent</Badge>
    case 'high':
      return <Badge className="bg-orange-500/10 text-orange-400 border-orange-500/20">High</Badge>
    // ... etc
  }
}
```

### ✨ Custom Notification Center Colors

#### Job Assignment Specific Colors
```typescript
const getNotificationColor = (category: string, priority: string) => {
  // Special colors for job assignments
  if (category === 'job_assigned') {
    switch (priority) {
      case 'urgent': return 'text-purple-400'   // Purple for job assignments
      case 'high': return 'text-purple-300'
      case 'medium': return 'text-purple-400'
      case 'low': return 'text-purple-500'
      default: return 'text-purple-400'
    }
  }

  // Regular colors for other notifications
  switch (category) {
    case 'report_generated': return 'text-blue-400'
    case 'task_completed': return 'text-emerald-400'
    // ... etc
  }
}
```

## 🚀 Implementation Steps

### Step 1: Choose Your Color Theme
Pick one of the themes above or create your own custom colors.

### Step 2: Update Banner Notifications
Edit `src/components/ui/SimpleToast.tsx`:
```typescript
// Replace the getBgColor function with your chosen theme
const getBgColor = () => {
  // Your custom colors here
}
```

### Step 3: Update Push Notifications
Edit `functions/src/jobNotifications.ts`:
```typescript
// Replace the color value in the android notification object
color: '#your-color-here'
```

### Step 4: Update Notification Center (Optional)
Edit `src/components/notifications/NotificationCenter.tsx` to match your theme.

### Step 5: Deploy Changes
```bash
# Deploy the Firebase Cloud Function changes
cd functions
npm run build
firebase deploy --only functions

# The web app changes will deploy automatically
```

## 🎨 Color Reference

### Popular Color Options:
- **Purple**: `#8b5cf6` - Modern, professional
- **Cyan**: `#06b6d4` - Fresh, tech-forward
- **Orange**: `#f97316` - Warm, attention-grabbing
- **Emerald**: `#10b981` - Success, growth
- **Indigo**: `#6366f1` - Current default
- **Rose**: `#f43f5e` - Elegant, standout

### Brand Color Matching:
If you have specific brand colors, convert them to hex and use those instead.

## 📱 Mobile App Team Coordination

The mobile app team should also update their notification colors to match:

```javascript
// Mobile app notification styling should match
const notificationColors = {
  jobAssignment: '#8b5cf6',  // Match your chosen color
  urgent: '#ef4444',
  high: '#f97316',
  medium: '#8b5cf6',
  low: '#06b6d4'
}
```

## 🧪 Testing

After making changes, test with:
1. Create a test job assignment
2. Check that both banner and push notifications show the new colors
3. Verify colors are consistent across web and mobile
4. Test different priority levels if using dynamic colors

---

**Which color theme would you like to implement? I can make the specific changes for you.**
