# Google Analytics Setup Guide

## Step 1: Get Your Measurement ID

1. Go to https://analytics.google.com
2. Sign in with your Google account
3. Click **Admin** (gear icon in bottom left)
4. Under **Property**, click **Create Property**
5. Fill in:
   - Property name: "tomlacy.net"
   - Time zone: Your timezone
   - Currency: USD
6. Click **Next** and complete setup
7. You'll get a **Measurement ID** like `G-XXXXXXXXXX`

## Step 2: Replace Placeholder in Your Code

1. Open `index.html` (already done ✅)
2. Find this line: `<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>`
3. Replace **both** instances of `G-XXXXXXXXXX` with your real Measurement ID

## Step 3: Add to Other Pages

Add the same code to the `<head>` section of these pages (right after `<head>` tag):

```html
<!-- Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
<script>
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', 'G-XXXXXXXXXX');
</script>
<!-- End Google Analytics -->
```

**Pages to update:**
- [ ] gallery.html
- [ ] sports.html
- [ ] tech.html
- [ ] leadership.html
- [ ] career.html
- [ ] manage.html
- [ ] metrics.html
- [ ] articles/measuring-engineering-at-scale.html
- [ ] engineering-metrics-presentation.html

## Step 4: Test Your Tracking

1. Push changes to GitHub
2. Wait 5 minutes for site to update
3. Visit your site at tomlacy.net
4. In Google Analytics, go to **Reports** → **Realtime**
5. You should see yourself as an active visitor!

## What You'll See in Analytics

After 24-48 hours, you'll have data on:
- **Visitor count** by day/week/month
- **Geographic location** (city/country)
- **Device type** (desktop/mobile/tablet)
- **Browser** and operating system
- **Page views** (which pages are most popular)
- **Traffic sources** (direct, Google search, referrals)
- **Session duration** and bounce rate

## Privacy Considerations

Google Analytics:
- ✅ Anonymizes IP addresses by default (GDPR compliant)
- ✅ Doesn't store PII unless you configure it to
- ✅ Provides aggregated insights, not individual tracking
- ✅ Industry standard, trusted by millions of sites

**Optional:** Add a privacy policy link in your footer mentioning analytics usage.

## Need Help?

- Google Analytics Help: https://support.google.com/analytics
- Check tracking is working: Use "Google Analytics Debugger" Chrome extension
