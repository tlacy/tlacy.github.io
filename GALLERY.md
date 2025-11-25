# Photo Gallery Management

## Overview

The photo gallery automatically discovers photos in `img/gallery/` and displays them with optional captions.

## Adding New Photos

1. **Add photos to the gallery directory:**
   ```bash
   cp your-photo.jpg img/gallery/
   ```

2. **Run the update script:**
   ```bash
   node scripts/update-gallery.js
   ```
   
   This will:
   - Scan `img/gallery/` for all image files
   - Add new photos to `gallery-metadata.json`
   - Update the hardcoded photo list in `gallery.html` (fallback)
   - Preserve existing captions

3. **Add captions (optional):**
   
   Edit `gallery-metadata.json` and add captions for your photos:
   
   ```json
   {
     "photos": {
       "img/gallery/sunset.jpg": {
         "caption": "Beautiful sunset over Lake Travis, Austin TX",
         "date": "2025-11-25"
       },
       "img/gallery/family.jpg": {
         "caption": "Family vacation in Colorado",
         "date": "2025-08-15"
       }
     }
   }
   ```

4. **Commit and deploy:**
   ```bash
   git add img/gallery/ gallery-metadata.json gallery.html
   git commit -m "Add new photos to gallery"
   git push origin master
   ```

## How It Works

### Automatic Photo Discovery

When visitors load the gallery page, it tries to:
1. Auto-discover photos from the `img/gallery/` directory (works on some servers)
2. Fall back to the hardcoded list in `gallery.html` (works everywhere, including GitHub Pages)

The update script maintains both the metadata file and the hardcoded list.

### Captions

Captions are stored in `gallery-metadata.json` and displayed below each photo in the lightbox view. Captions are optional—photos without captions will display normally.

### Supported Formats

- `.jpg` / `.jpeg`
- `.png`
- `.gif`
- `.heic`
- `.webp`

## File Structure

```
img/gallery/          # All your photos go here
gallery-metadata.json # Photo captions and metadata
gallery.html          # Gallery page (auto-updated by script)
scripts/
  update-gallery.js   # Run this after adding photos
```

## Quick Reference

```bash
# Add photos
cp *.jpg img/gallery/

# Update gallery
node scripts/update-gallery.js

# Add captions
vim gallery-metadata.json

# Deploy
git add -A
git commit -m "Update photo gallery"
git push origin master
```

## Tips

- **Image Optimization:** Consider compressing images before uploading to improve load times
  ```bash
  # Using ImageMagick
  mogrify -resize 2000x2000\> -quality 85 img/gallery/*.jpg
  ```

- **Bulk Captions:** You can edit `gallery-metadata.json` in any text editor or use `manage.html` for a UI-based editor

- **Removing Photos:** Just delete the photo from `img/gallery/` and run the update script—it will remove it from the metadata automatically

## Troubleshooting

**Photos not showing up?**
- Run `node scripts/update-gallery.js`
- Check that photos are in `img/gallery/` with supported extensions
- Clear browser cache and reload

**Captions not displaying?**
- Check `gallery-metadata.json` for syntax errors (valid JSON)
- Ensure the photo path matches exactly (case-sensitive)
- Check browser console for errors

## Example Workflow

```bash
# 1. Add photos from your camera/phone
cp ~/Downloads/vacation-photos/*.jpg img/gallery/

# 2. Update gallery
node scripts/update-gallery.js

# 3. Add captions (opens in default editor)
code gallery-metadata.json  # or vim, nano, etc.

# 4. Preview locally
python3 -m http.server 8000
# Visit http://localhost:8000/gallery.html

# 5. Deploy when happy
git add -A
git commit -m "Add vacation photos"
git push
```
