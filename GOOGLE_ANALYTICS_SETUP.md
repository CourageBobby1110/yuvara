# Google Analytics 4 (GA4) Setup Guide for Yuvara

## Step 1: Create a Google Analytics Account (or use existing)

1. Go to **[Google Analytics](https://analytics.google.com)**
2. Sign in with your Google account (or create one)
3. Click **"Start measuring"** or **"Admin"** → **"Create Property"**
4. Select **"Web"** as your platform
5. Enter your property details:
   - **Property name**: `Yuvara E-commerce` (or `Yuvara Website` - this is just a label)
   - **Reporting time zone**: Your local timezone (e.g., `Africa/Lagos` for Nigeria)
   - **Currency**: Your local currency (e.g., `USD` or `NGN`)
6. Click **"Next"** and enter your business information
7. Select your industry category: **E-commerce**
8. Click **"Create"**

**If you already have a GA4 ID (like `G-EFV6KLXZW3`), skip to Step 3!**

## Step 2: Get Your Google Analytics 4 (GA4) Measurement ID

1. After creating the property, you'll be on the **"Data Streams"** page
2. Click **"Add stream"** → **"Web"**
3. Enter your URL and stream name
4. Your **Measurement ID** will look like: `G-XXXXXXXXXX` (this is your GA4 ID)
5. Copy this ID - you'll need it for the next step

## Step 3: Configure Google Analytics in Your Project

You have **two options** to configure your GA4 ID:

### Option A: Using Environment Variables (Recommended for development)

Create a `.env.local` file in your project root (if it doesn't exist) and add:

```env
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
NEXT_PUBLIC_GTM_ID=GTM-XXXXXXXXXX  # Optional: Google Tag Manager ID
```

Replace `G-XXXXXXXXXX` with your actual GA4 Measurement ID.

### Option B: Using Admin Dashboard (Recommended for production)

1. Log into your admin panel at `/admin`
2. Navigate to **Settings** → **Store Settings**
3. In the **"Marketing Integrations"** section, find **"Google Analytics ID"**
4. Enter your GA4 ID (format: `G-XXXXXXXXXX`)
5. Click **"Save Settings"**

## Step 4: Verify Your Setup

1. Deploy your site (or run locally with `npm run dev`)
2. Visit your website
3. Open browser developer tools (F12) → **Network** tab
4. Look for requests to `google-analytics.com` or `googletagmanager.com`
5. Or use the **[Google Analytics Debugger](https://chrome.google.com/webstore/detail/google-analytics-debugger/jnkmfdileelhofjdfnkfdlfohghglfkfm)** Chrome extension

## Step 5: View Your Analytics Data

1. Go to **[Google Analytics](https://analytics.google.com)**
2. Select your property
3. Navigate to **"Reports"** → **"Realtime"** to see live visitors
4. Check **"Reports"** → **"Engagement"** → **"Overview"** for page views and events

## Important Notes

- Your project uses **Next.js 16** with `@next/third-parties/google` for GA integration
- The GA code is already implemented in `app/layout.tsx`
- Admin users are automatically excluded from tracking (to avoid skewing your data)
- The system also supports **Google Tag Manager** (GTM) for advanced tracking

## Troubleshooting

If analytics isn't working:
1. Check that your GA4 ID is in the correct format: `G-XXXXXXXXXX`
2. Verify the `.env.local` file is in the project root (not `.env`)
3. Make sure you've saved the settings in the admin panel
4. Check browser console for any errors
5. Ensure you're not logged in as an admin (admin tracking is blocked)