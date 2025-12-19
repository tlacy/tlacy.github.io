# Gallery Admin - Quick Setup (Personal Access Token)

## Overview

This is a simplified admin interface that uses a GitHub Personal Access Token instead of OAuth. It works directly on GitHub Pages without any additional setup.

## Setup Steps

### 1. Create a GitHub Personal Access Token

1. Go to https://github.com/settings/tokens/new
2. Fill in the details:
   - **Note:** `tomlacy.net Gallery Admin`
   - **Expiration:** Choose your preference (90 days, 1 year, or no expiration)
   - **Scopes:** Check **`repo`** (Full control of private repositories)
3. Click "Generate token"
4. **Copy the token immediately** (you won't be able to see it again!)
5. Store it somewhere safe (password manager recommended)

### 2. Access the Admin Interface

1. Visit https://www.tomlacy.net/admin/gallery.html
2. Click "Enter Access Token"
3. Paste your token in the prompt
4. The token is saved in your browser's localStorage

### 3. Edit Your Photos

1. You'll see a grid of all your gallery photos
2. Click on any caption or date field to edit
3. Changes are saved locally as you type
4. Click "💾 Save All Changes" to commit to GitHub
5. GitHub Pages will rebuild your site automatically (1-2 minutes)

## Security Notes

**Important:** This approach stores your token in the browser's localStorage.

✅ **Safe:**
- Only works on your computer/browser
- Token is never sent anywhere except GitHub API
- Only you can access the admin page with the token

⚠️ **Be Careful:**
- Don't share screenshots of the admin page (token is in localStorage)
- Use a token with only `repo` scope (not full account access)
- Consider setting an expiration date on the token
- Use in a private/secure browser environment

🔒 **Best Practices:**
- Only use this admin on your personal computer
- Don't use on public/shared computers
- Clear browser data if you stop using it
- Regenerate token if you suspect it's compromised

## Usage

### Editing Photos

1. Visit `/admin/gallery.html`
2. Enter your token (first time only)
3. Edit captions and dates
4. Click "Save All Changes"
5. Done! Changes are committed to your repo

### Signing Out

Click "Sign Out" in the top right to clear your token from the browser.

### Regenerating Your Token

If you need to create a new token:
1. Go to https://github.com/settings/tokens
2. Find your old token and click "Delete"
3. Create a new token following the steps above
4. Visit the admin page and enter the new token

## Troubleshooting

**"Authentication failed"**
- Make sure you copied the entire token
- Verify the token has `repo` scope
- Check that the token hasn't expired
- Try regenerating the token

**"You do not have access to this repository"**
- Ensure you're using a token from the GitHub account that owns `tlacy/tlacy.github.io`
- Verify the `repo` scope is enabled

**Changes not saving**
- Check browser console for errors (F12)
- Verify you have write access to the repository
- Try signing out and back in with a fresh token

**Token lost/forgotten**
- Generate a new token (old ones can't be recovered)
- Delete the old token from GitHub settings for security

## Advanced: Protecting the Admin Page

If you want to add an extra layer of protection, you can:

### Option 1: Password Protect with .htaccess (Apache)
```apache
<Files "gallery.html">
  AuthType Basic
  AuthName "Restricted Area"
  AuthUserFile /path/to/.htpasswd
  Require valid-user
</Files>
```

### Option 2: Use a Hard-to-Guess URL
Rename the file to something less obvious:
```bash
mv admin/gallery.html admin/edit-photos-2025-private.html
```

### Option 3: Add IP Whitelist (Netlify/Cloudflare)
Use edge functions to restrict access by IP address.

## Comparison with OAuth Approach

**Personal Access Token (Current):**
- ✅ Works on GitHub Pages (no backend needed)
- ✅ Simple setup (5 minutes)
- ✅ No external dependencies
- ⚠️ Token stored in browser
- ⚠️ Need to manage token expiration

**OAuth (Alternative):**
- ✅ More secure (no token storage)
- ✅ Standard authentication flow
- ✅ Fine-grained permissions
- ❌ Requires Netlify/backend
- ❌ More complex setup

## Support

If you have issues:
1. Check the troubleshooting section above
2. Review browser console for error messages (F12)
3. Verify token permissions at https://github.com/settings/tokens
4. Try regenerating your token

## Next Steps

Once comfortable with the admin:
- Set up regular token rotation (every 90 days)
- Consider adding a password manager for token storage
- Explore bulk editing features
- Add custom keyboard shortcuts

Enjoy managing your gallery! 📸
