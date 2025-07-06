# 📧 Make.com Onboarding Survey Email Setup Guide

## 🎯 Email Details

### **Subject Line:**
```
Thank you {{USER_NAME}}! Your Sia Moon setup is complete 🎯
```

### **Webhook URL:**
```
https://hook.eu2.make.com/b59iga7bj65atyrgo5ej9dwvlujdsupa
```

---

## 📋 Step-by-Step Make.com Implementation

### **Step 1: Create New Scenario**
1. Log into your Make.com account
2. Click **"Create a new scenario"**
3. Name it: `"Sia Moon - Onboarding Survey Email"`

### **Step 2: Add Webhook Trigger**
1. Click the **"+"** to add first module
2. Search for **"Webhooks"**
3. Select **"Custom webhook"**
4. Click **"Add"** to create new webhook
5. Copy the webhook URL: `https://hook.eu2.make.com/b59iga7bj65atyrgo5ej9dwvlujdsupa`
6. Click **"OK"**

### **Step 3: Add Gmail Module**
1. Click the **"+"** after the webhook
2. Search for **"Gmail"**
3. Select **"Send an email"**
4. Connect your Gmail account if not already connected

### **Step 4: Configure Gmail Module**

#### **To Field:**
```
{{1.userData.email}}
```

#### **Subject Field:**
```
Thank you {{1.userData.name}}! Your Sia Moon setup is complete 🎯
```

#### **Content Type:**
Select: **"HTML"**

#### **Content Field:**
```html
<div style="max-width: 600px; margin: 0 auto; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
    
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #1e293b 0%, #334155 100%); padding: 40px 30px; text-align: center; color: white;">
        <div style="font-size: 28px; font-weight: 700; margin-bottom: 10px; letter-spacing: -0.5px;">Sia Moon</div>
        <p style="font-size: 16px; opacity: 0.9; margin: 0;">Property Management Excellence</p>
    </div>

    <!-- Main Content -->
    <div style="padding: 40px 30px;">
        <h1 style="font-size: 24px; font-weight: 600; color: #1e293b; margin-bottom: 20px; text-align: center;">
            Thank you, {{1.userData.name}}! Your setup is complete 🎯
        </h1>
        
        <p style="font-size: 16px; color: #64748b; margin-bottom: 30px; text-align: center;">
            We've received your onboarding survey and your Sia Moon Property Management account is now fully customized to your needs. 
            Based on your responses, we've prepared personalized recommendations to help you get the most out of our platform.
        </p>

        <div style="text-align: center; margin: 30px 0;">
            <a href="https://your-domain.com/dashboard/client" style="display: inline-block; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; text-decoration: none; padding: 16px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
                View Your Personalized Dashboard
            </a>
        </div>

        <!-- Survey Summary -->
        <div style="background-color: #f0f9ff; border-radius: 8px; padding: 30px; margin: 30px 0; border-left: 4px solid #3b82f6;">
            <h2 style="font-size: 20px; font-weight: 600; color: #1e293b; margin-bottom: 20px; text-align: center;">
                📋 Your Survey Summary
            </h2>
            <div style="background-color: white; border-radius: 6px; padding: 20px; margin-bottom: 15px;">
                <p style="margin: 0; font-size: 14px; color: #64748b;">
                    <strong style="color: #1e293b;">Property Type:</strong> {{1.metadata.propertyType}}<br>
                    <strong style="color: #1e293b;">Number of Properties:</strong> {{1.metadata.propertyCount}}<br>
                    <strong style="color: #1e293b;">Primary Goal:</strong> {{1.metadata.primaryGoal}}<br>
                    <strong style="color: #1e293b;">Experience Level:</strong> {{1.metadata.experienceLevel}}
                </p>
            </div>
        </div>

        <!-- Personalized Recommendations -->
        <div style="background-color: #f8fafc; border-radius: 8px; padding: 30px; margin: 30px 0;">
            <h2 style="font-size: 20px; font-weight: 600; color: #1e293b; margin-bottom: 20px; text-align: center;">
                🎯 Recommended Next Steps
            </h2>
            <ul style="list-style: none; padding: 0; margin: 0;">
                <li style="display: flex; align-items: flex-start; margin-bottom: 15px; font-size: 15px; color: #475569;">
                    <span style="width: 24px; height: 24px; background-color: #3b82f6; border-radius: 50%; margin-right: 12px; display: flex; align-items: center; justify-content: center; color: white; font-size: 12px; font-weight: bold; flex-shrink: 0; margin-top: 2px;">1</span>
                    <div>
                        <strong style="color: #1e293b;">Set up your first property</strong><br>
                        <span style="font-size: 13px; color: #64748b;">Add photos, amenities, and pricing details to start attracting guests</span>
                    </div>
                </li>
                <li style="display: flex; align-items: flex-start; margin-bottom: 15px; font-size: 15px; color: #475569;">
                    <span style="width: 24px; height: 24px; background-color: #3b82f6; border-radius: 50%; margin-right: 12px; display: flex; align-items: center; justify-content: center; color: white; font-size: 12px; font-weight: bold; flex-shrink: 0; margin-top: 2px;">2</span>
                    <div>
                        <strong style="color: #1e293b;">Connect your booking platforms</strong><br>
                        <span style="font-size: 13px; color: #64748b;">Sync with Airbnb, Booking.com, and other channels for unified management</span>
                    </div>
                </li>
                <li style="display: flex; align-items: flex-start; margin-bottom: 15px; font-size: 15px; color: #475569;">
                    <span style="width: 24px; height: 24px; background-color: #3b82f6; border-radius: 50%; margin-right: 12px; display: flex; align-items: center; justify-content: center; color: white; font-size: 12px; font-weight: bold; flex-shrink: 0; margin-top: 2px;">3</span>
                    <div>
                        <strong style="color: #1e293b;">Configure automated tasks</strong><br>
                        <span style="font-size: 13px; color: #64748b;">Set up cleaning schedules and maintenance reminders</span>
                    </div>
                </li>
                <li style="display: flex; align-items: flex-start; margin-bottom: 15px; font-size: 15px; color: #475569;">
                    <span style="width: 24px; height: 24px; background-color: #3b82f6; border-radius: 50%; margin-right: 12px; display: flex; align-items: center; justify-content: center; color: white; font-size: 12px; font-weight: bold; flex-shrink: 0; margin-top: 2px;">4</span>
                    <div>
                        <strong style="color: #1e293b;">Invite your team</strong><br>
                        <span style="font-size: 13px; color: #64748b;">Add staff members and assign roles for seamless collaboration</span>
                    </div>
                </li>
            </ul>
        </div>

        <!-- Special Offer -->
        <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border-radius: 8px; padding: 25px; margin: 30px 0; text-align: center;">
            <h3 style="font-size: 18px; font-weight: 600; color: #92400e; margin-bottom: 10px;">🎁 Welcome Bonus</h3>
            <p style="font-size: 14px; color: #78350f; margin-bottom: 15px;">
                As a thank you for completing your onboarding, enjoy <strong>30 days of premium features</strong> at no extra cost!
            </p>
            <div style="background-color: white; border-radius: 6px; padding: 15px; margin-top: 15px;">
                <p style="margin: 0; font-size: 13px; color: #64748b;">
                    ✨ Advanced analytics & reporting<br>
                    ✨ Priority customer support<br>
                    ✨ Custom branding options<br>
                    ✨ Unlimited team members
                </p>
            </div>
        </div>

        <p style="text-align: center; color: #64748b; font-size: 14px; margin-top: 30px;">
            Questions about your account or need assistance?<br>
            <a href="mailto:support@siamoon.com" style="color: #3b82f6; text-decoration: none;">Contact our support team</a> - we typically respond within 2 hours.
        </p>
    </div>

    <!-- Footer -->
    <div style="background-color: #f1f5f9; padding: 30px; text-align: center; border-top: 1px solid #e2e8f0;">
        <p style="font-size: 14px; color: #64748b; margin-bottom: 15px;">
            <strong>Sia Moon Property Management</strong><br>
            Streamlining villa operations across Southeast Asia
        </p>
        
        <div style="margin: 20px 0;">
            <a href="#" style="display: inline-block; margin: 0 10px; color: #64748b; text-decoration: none; font-size: 14px;">Website</a>
            <a href="#" style="display: inline-block; margin: 0 10px; color: #64748b; text-decoration: none; font-size: 14px;">Support</a>
            <a href="#" style="display: inline-block; margin: 0 10px; color: #64748b; text-decoration: none; font-size: 14px;">Privacy Policy</a>
        </div>

        <div style="font-size: 12px; color: #94a3b8; margin-top: 20px;">
            <p>
                You received this email because you completed the onboarding survey for Sia Moon Property Management.<br>
                <a href="#" style="color: #64748b; text-decoration: none;">Unsubscribe</a> | 
                <a href="#" style="color: #64748b; text-decoration: none;">Update Preferences</a>
            </p>
        </div>
    </div>
</div>
```

#### **From Field:**
```
onboarding@siamoon.com
```

#### **From Name Field:**
```
Sia Moon Onboarding Team
```

### **Step 5: Test the Webhook**
1. Click **"Run once"** in Make.com
2. The webhook will wait for data
3. Test from your app or use the test endpoint

### **Step 6: Activate Scenario**
1. Click **"Save"** 
2. Toggle the scenario to **"ON"**
3. Your webhook is now live!

---

## 🔧 Expected Webhook Payload

Your application should send this JSON structure:

```json
{
  "to": "user@example.com",
  "subject": "Thank you John! Your Sia Moon setup is complete 🎯",
  "html": "...",
  "text": "...",
  "from": "onboarding@siamoon.com",
  "fromName": "Sia Moon Onboarding Team",
  "type": "onboarding_completion",
  "userData": {
    "name": "John Doe",
    "email": "user@example.com",
    "userId": "user-123"
  },
  "metadata": {
    "propertyType": "Villa",
    "propertyCount": "1-3 properties",
    "primaryGoal": "Increase bookings",
    "experienceLevel": "Beginner",
    "surveyCompletionDate": "2025-07-06T10:45:21.178Z",
    "source": "onboarding_survey"
  }
}
```

---

## ✅ Testing Checklist

- [ ] Webhook URL is correct
- [ ] Gmail account is connected
- [ ] Subject line includes user name
- [ ] HTML content renders properly
- [ ] Survey data appears in email
- [ ] Dashboard link works
- [ ] From address is set correctly
- [ ] Scenario is activated

---

## 🎯 Key Features

✅ **Personalized Content**: Uses user's name and survey responses
✅ **Professional Design**: Matches Sia Moon branding
✅ **Survey Summary**: Shows user's responses
✅ **Next Steps**: Actionable recommendations
✅ **Welcome Bonus**: 30-day premium trial
✅ **Support Links**: Multiple contact options
✅ **Mobile Responsive**: Works on all devices

Your onboarding survey completion email is now ready to provide users with a personalized, professional experience! 🚀
