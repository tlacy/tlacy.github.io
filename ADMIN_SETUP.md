# Gallery Admin Setup Guide

## Overview

The gallery admin allows you to edit photo captions and dates through a web interface, authenticated via GitHub. Changes are committed directly to your repository.

## Setup Steps

### 1. Create a GitHub OAuth App

1. Go to https://github.com/settings/developers
2. Click "New OAuth App"
3. Fill in the details:
   - **Application name:** `tomlacy.net Gallery Admin`
   - **Homepage URL:** `https://www.tomlacy.net`
   - **Authorization callback URL:** `https://www.tomlacy.net/admin/gallery.html`
4. Click "Register application"
5. Copy the **Client ID**
6. Generate a **Client Secret** and copy it

### 2. Deploy to Netlify

Since GitHub Pages doesn't support serverless functions, you need to deploy to Netlify:

1. **Sign up for Netlify:** https://app.netlify.com/signup (free tier is fine)

2. **Connect your GitHub repo:**
   - Click "New site from Git"
   - Choose GitHub
   - Select `tlacy/tlacy.github.io`
   - Build settings:
     - Build command: (leave empty)
     - Publish directory: `.`
   - Click "Deploy site"

3. **Set up custom domain:**
   - Go to Site settings → Domain management
   - Add custom domain: `www.tomlacy.net`
   - Follow DNS instructions to point your domain to Netlify

4. **Add environment variables:**
   - Go to Site settings → Environment variables
   - Add two variables:
     - `GITHUB_CLIENT_ID`: (paste your GitHub OAuth Client ID)
     - `GITHUB_CLIENT_SECRET`: (paste your GitHub OAuth Client Secret)

5. **Update the admin page:**
   - Edit `admin/gallery.html`
   - Replace `YOUR_GITHUB_CLIENT_ID` with your actual Client ID (line ~178)

### 3. Update GitHub OAuth App

Once deployed to Netlify:
1. Go back to your GitHub OAuth App settings
2. Update the **Authorization callback URL** to your Netlify URL:
   - If using custom domain: `https://www.tomlacy.net/admin/gallery.html`
   - Or temporary Netlify domain: `https://your-site.netlify.app/admin/gallery.html`

### 4. Test the Admin Interface

1. Visit `https://www.tomlacy.net/admin/gallery.html`
2. Click "Sign in with GitHub"
3. Authorize the app
4. You should see your photo gallery with editable captions and dates
5. Make changes and click "Save All Changes"
6. Changes are committed to your repo automatically!

## Alternative: Stay on GitHub Pages

If you want to keep using GitHub Pages without Netlify:

### Option A: Use GitHub Personal Access Token (Simpler, Less Secure)

1. Create a Personal Access Token:
   - Go to https://github.com/settings/tokens
   - Generate new token (classic)
   - Scopes: `repo`
   - Copy the token

2. Modify `admin/gallery.html` to prompt for token instead of OAuth
3. Token is stored locally in browser
4. **Security note:** Anyone with the URL can access if they have/find your token

### Option B: Local-Only Editing

Keep the admin page but run it locally:
1. `python3 -m http.server 8000`
2. Visit `http://localhost:8000/admin/gallery.html`
3. Use a Personal Access Token for authentication
4. Edit and save changes locally, then commit manually

## Security Notes

- Only users with write access to your GitHub repo can make changes
- Access tokens are stored in browser localStorage
- Tokens are never exposed in client-side code
- All commits are tracked in Git history
- You can revoke OAuth app access anytime in GitHub settings

## Troubleshooting

**"Authentication failed"**
- Check that your Client ID and Secret are correct
- Verify the callback URL matches exactly
- Ensure environment variables are set in Netlify

**"You do not have access to this repository"**
- Make sure you're signing in with the GitHub account that owns the repo
- Or that your account has been added as a collaborator

**Changes not saving**
- Check browser console for errors
- Verify you have write access to the repository
- Try signing out and back in

**OAuth callback not working**
- Verify the callback URL in GitHub OAuth settings matches your site URL exactly
- Check that the serverless function is deployed (Netlify Function logs)

## Usage

Once set up:
1. Visit `/admin/gallery.html`
2. Sign in with GitHub
3. Edit captions and dates
4. Click "Save All Changes"
5. Changes are committed automatically
6. GitHub Pages will rebuild your site (takes 1-2 minutes)

## Cost

- **GitHub Pages:** Free
- **Netlify Free Tier:** 
  - 100GB bandwidth/month
  - 125k function invocations/month
  - More than enough for a personal site

## Next Steps

After setup, you might want to:
- Add an "Admin" link to your main navigation
- Set up a custom 404 page for the admin section
- Add image upload functionality
- Bulk import captions from a CSV file

Let me know if you need help with any of these steps!
