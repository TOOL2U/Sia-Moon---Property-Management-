# 🚀 Production Deployment Guide

This guide covers the complete process for deploying the Villa Property Management application to production.

## 📋 Pre-Deployment Checklist

### ✅ **Environment Setup**
- [ ] Production Supabase project created
- [ ] Environment variables configured
- [ ] Domain and SSL certificate ready
- [ ] Email service configured (SMTP)
- [ ] Cloudinary account set up for production
- [ ] Error monitoring service configured

### ✅ **Security Verification**
- [ ] `NODE_ENV=production`
- [ ] `NEXT_PUBLIC_BYPASS_AUTH=false`
- [ ] All demo accounts removed
- [ ] RLS policies enabled
- [ ] Email confirmation enabled
- [ ] Strong password requirements enforced

### ✅ **Code Quality**
- [ ] All TypeScript errors resolved
- [ ] ESLint warnings addressed
- [ ] Production build successful
- [ ] All tests passing

## 🌍 **Deployment Platforms**

### **Option 1: Vercel (Recommended)**

1. **Connect Repository**
   ```bash
   # Install Vercel CLI
   npm i -g vercel
   
   # Login and deploy
   vercel login
   vercel --prod
   ```

2. **Configure Environment Variables**
   - Go to Vercel Dashboard → Project → Settings → Environment Variables
   - Add all variables from `.env.example`
   - Ensure `NODE_ENV=production`

3. **Custom Domain**
   - Add your domain in Vercel Dashboard
   - Configure DNS records as instructed

### **Option 2: Netlify**

1. **Build Settings**
   ```
   Build command: npm run build:production
   Publish directory: .next
   ```

2. **Environment Variables**
   - Configure in Netlify Dashboard → Site Settings → Environment Variables

### **Option 3: Self-Hosted (VPS/Docker)**

1. **Server Requirements**
   - Node.js 18+ 
   - PM2 for process management
   - Nginx for reverse proxy
   - SSL certificate (Let's Encrypt)

2. **Deployment Script**
   ```bash
   # Run the production deployment script
   chmod +x scripts/deploy-production.sh
   ./scripts/deploy-production.sh
   ```

## 🗄️ **Database Setup**

### **1. Create Production Supabase Project**
```bash
# Create new project at https://supabase.com/dashboard
# Note down the project URL and keys
```

### **2. Run Database Migrations**
```bash
# Link to your production project
supabase link --project-ref YOUR_PROJECT_REF

# Push migrations
supabase db push
```

### **3. Configure Authentication**
```bash
# In Supabase Dashboard → Authentication → Settings:
# - Enable email confirmations
# - Set site URL to your production domain
# - Configure email templates
# - Set up custom SMTP (optional)
```

## 📧 **Email Configuration**

### **Option 1: Supabase Built-in Email**
- Configure in Supabase Dashboard → Authentication → Settings
- Customize email templates
- Set your domain in "Site URL"

### **Option 2: Custom SMTP**
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
FROM_EMAIL=noreply@yourdomain.com
FROM_NAME=Your App Name
```

## 🖼️ **Image Storage Setup**

### **Cloudinary Configuration**
1. Create production Cloudinary account
2. Configure environment variables:
   ```env
   NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret
   ```

## 🔐 **Security Configuration**

### **Environment Variables**
```env
# Required for production
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://yourdomain.com
NEXT_PUBLIC_BYPASS_AUTH=false

# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_production_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Email
SMTP_HOST=your_smtp_host
SMTP_PORT=587
SMTP_USER=your_email
SMTP_PASS=your_password
FROM_EMAIL=noreply@yourdomain.com
```

### **Security Headers**
The application automatically sets security headers in production:
- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff
- Referrer-Policy: strict-origin-when-cross-origin
- Permissions-Policy: camera=(), microphone=(), geolocation=()

## 📊 **Monitoring & Analytics**

### **Error Tracking**
The application includes built-in error logging that sends errors to:
- Console (development)
- Database (production)
- External webhooks (configurable)

### **Optional Integrations**
```env
# Sentry for error tracking
SENTRY_DSN=your_sentry_dsn

# Google Analytics
NEXT_PUBLIC_GOOGLE_ANALYTICS_ID=your_ga_id

# Vercel Analytics
VERCEL_ANALYTICS_ID=your_vercel_analytics_id
```

## 🚀 **Deployment Steps**

### **1. Prepare for Deployment**
```bash
# Clean and install dependencies
npm run clean
npm ci

# Type check
npm run type-check

# Lint and fix issues
npm run lint:fix

# Build for production
npm run build:production
```

### **2. Deploy to Platform**
```bash
# For Vercel
vercel --prod

# For Netlify
netlify deploy --prod

# For self-hosted
./scripts/deploy-production.sh
```

### **3. Post-Deployment Verification**
- [ ] Application loads correctly
- [ ] User registration works with email verification
- [ ] Password reset functionality works
- [ ] Dashboard loads with proper data
- [ ] Image uploads work
- [ ] Email notifications are sent
- [ ] Error logging is working

## 🔧 **Post-Deployment Configuration**

### **1. DNS Configuration**
```
# A Record
@ → your_server_ip

# CNAME Record  
www → yourdomain.com
```

### **2. SSL Certificate**
- Automatic with Vercel/Netlify
- For self-hosted: Use Let's Encrypt

### **3. Email Templates**
- Customize in Supabase Dashboard → Authentication → Email Templates
- Update with your branding and domain

### **4. Backup Strategy**
```bash
# Set up automated database backups
# Configure in Supabase Dashboard → Settings → Database
```

## 🐛 **Troubleshooting**

### **Common Issues**

1. **Build Failures**
   ```bash
   # Clear cache and rebuild
   npm run clean
   npm ci
   npm run build:production
   ```

2. **Environment Variable Issues**
   - Verify all required variables are set
   - Check for typos in variable names
   - Ensure no trailing spaces

3. **Database Connection Issues**
   - Verify Supabase URL and keys
   - Check RLS policies
   - Ensure migrations are applied

4. **Email Issues**
   - Verify SMTP credentials
   - Check spam folders
   - Ensure domain is verified

## 📞 **Support**

For deployment issues:
1. Check the error logs in your deployment platform
2. Verify environment variables
3. Check Supabase logs
4. Review the troubleshooting section above

## 🔄 **Updates and Maintenance**

### **Regular Updates**
```bash
# Update dependencies
npm update

# Run security audit
npm audit

# Update database schema if needed
supabase db push
```

### **Monitoring**
- Set up uptime monitoring
- Monitor error rates
- Track performance metrics
- Regular database backups

---

**🎉 Your Villa Property Management application is now ready for production!**
