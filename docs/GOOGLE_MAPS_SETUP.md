# Google Maps API Setup Guide

This guide explains how to set up Google Maps API for the Sia Moon Property Management system.

## 🗺️ Overview

The application uses Google Maps for:
- **Staff Schedule Map**: Shows real-time staff locations and assignments
- **Property Location Mapping**: Displays property locations on interactive maps
- **Address Autocomplete**: Smart address input with suggestions and validation
- **Navigation Services**: Provides directions to job sites

## 🔑 Getting a Google Maps API Key

### Step 1: Create a Google Cloud Project

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Click "Create Project" or select an existing project
3. Give your project a name (e.g., "Sia Moon Property Management")
4. Click "Create"

### Step 2: Enable Required APIs

1. In the Google Cloud Console, go to **APIs & Services > Library**
2. Enable the following APIs:
   - **Maps Embed API** (for interactive embedded maps)
   - **Maps Static API** (for static maps with markers)
   - **Places API** (for address autocomplete and place search)
   - **Maps JavaScript API** (optional, for advanced features)
   - **Geocoding API** (optional, for address-to-coordinates conversion)

### Step 3: Create API Key

1. Go to **APIs & Services > Credentials**
2. Click **"+ CREATE CREDENTIALS"** > **"API key"**
3. Copy the generated API key
4. Click **"RESTRICT KEY"** for security

### Step 4: Configure API Key Restrictions (Recommended)

#### Application Restrictions:
- **HTTP referrers (web sites)**
- Add your domains:
  - `http://localhost:3000/*` (for development)
  - `https://yourdomain.com/*` (for production)

#### API Restrictions:
- **Restrict key**
- Select the APIs you enabled in Step 2

## 🔧 Configuration

### Environment Variables

Add your Google Maps API key to your environment configuration:

#### Development (.env.local)
```bash
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
```

#### Production
Set the environment variable in your deployment platform:
- **Vercel**: Project Settings > Environment Variables
- **Netlify**: Site Settings > Environment Variables
- **Railway**: Variables tab
- **Docker**: Add to your docker-compose.yml or Dockerfile

### Verification

1. Restart your development server
2. Navigate to `/dashboard/ai`
3. Check the Staff Schedule Map component
4. You should see:
   - ✅ Interactive Google Maps (if API key is valid)
   - ⚠️ "Maps Offline" badge (if API key is missing/invalid)
   - 🎨 Beautiful fallback map (if Google Maps fails)

## 💰 Pricing Information

Google Maps APIs have usage-based pricing:

- **Maps Embed API**: Free up to 100,000 requests/month
- **Maps Static API**: $2 per 1,000 requests after free tier
- **Free Tier**: $200 credit per month (covers most small-medium applications)

### Cost Optimization Tips:
1. **Use API restrictions** to prevent unauthorized usage
2. **Cache map images** when possible
3. **Use fallback maps** for non-critical features
4. **Monitor usage** in Google Cloud Console

## 🛡️ Security Best Practices

### 1. API Key Restrictions
- ✅ Always restrict API keys to specific domains
- ✅ Only enable required APIs
- ❌ Never use unrestricted API keys in production

### 2. Environment Variables
- ✅ Use `NEXT_PUBLIC_` prefix for client-side keys
- ✅ Keep API keys in environment variables, not code
- ❌ Never commit API keys to version control

### 3. Monitoring
- ✅ Set up billing alerts in Google Cloud
- ✅ Monitor API usage regularly
- ✅ Review API key usage in Google Cloud Console

## 🔧 Troubleshooting

### "The provided API key is invalid"
1. **Check API key format**: Should be a long string starting with `AIza`
2. **Verify environment variable**: Ensure `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` is set
3. **Restart server**: Environment changes require server restart
4. **Check API restrictions**: Ensure your domain is allowed

### "Google Maps Platform rejected your request"
1. **Enable required APIs**: Maps Embed API and Maps Static API
2. **Check billing**: Ensure billing is enabled for your Google Cloud project
3. **Verify quotas**: Check if you've exceeded API quotas

### Maps not loading
1. **Check browser console**: Look for specific error messages
2. **Verify network**: Ensure Google Maps can be accessed
3. **Test API key**: Use Google's API key testing tools

### Fallback Map Always Showing
1. **API key missing**: Check environment variable is set correctly
2. **API key invalid**: Verify the key in Google Cloud Console
3. **APIs not enabled**: Ensure required APIs are enabled
4. **Domain restrictions**: Check if your domain is allowed

## 🎨 Fallback Behavior

The application gracefully handles missing or invalid Google Maps configuration:

### When Google Maps is Available:
- ✅ Interactive embedded maps
- ✅ Static maps with staff location markers
- ✅ Toggle between map modes
- ✅ Real-time staff tracking

### When Google Maps is Not Available:
- 🎨 Beautiful custom fallback map
- 📍 Staff assignment list display
- ⚠️ Clear "Maps Offline" indicator
- 🔄 Automatic retry when configuration is fixed

## 📞 Support

If you need help setting up Google Maps:

1. **Check the logs**: Look for Google Maps errors in browser console
2. **Verify configuration**: Use the environment info in development mode
3. **Test API key**: Use Google's API testing tools
4. **Contact support**: Reach out with specific error messages

## 🚀 Quick Setup Checklist

- [ ] Create Google Cloud project
- [ ] Enable Maps Embed API
- [ ] Enable Maps Static API
- [ ] Create and restrict API key
- [ ] Add `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` to environment
- [ ] Restart development server
- [ ] Test maps in `/dashboard/ai`
- [ ] Verify no "Maps Offline" badge
- [ ] Set up billing alerts (recommended)

---

**Note**: The application works perfectly without Google Maps - the fallback system provides a beautiful alternative that displays all staff assignment information clearly.
