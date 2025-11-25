#!/usr/bin/env node

/**
 * Gallery Auto-Update Script
 * 
 * This script scans img/gallery/ for image files and:
 * 1. Updates gallery-metadata.json with new photos (preserves existing captions)
 * 2. Generates a photos list for the gallery.html fallback
 * 
 * Usage:
 *   node scripts/update-gallery.js
 * 
 * After adding new photos to img/gallery/, run this script to:
 * - Add them to the gallery metadata
 * - Regenerate the hardcoded photo list
 */

const fs = require('fs');
const path = require('path');

const GALLERY_DIR = path.join(__dirname, '../img/gallery');
const METADATA_FILE = path.join(__dirname, '../gallery-metadata.json');
const GALLERY_HTML = path.join(__dirname, '../gallery.html');

// Supported image extensions
const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.heic', '.webp'];

function scanGalleryDirectory() {
  console.log('Scanning gallery directory...');
  
  if (!fs.existsSync(GALLERY_DIR)) {
    console.error(`Gallery directory not found: ${GALLERY_DIR}`);
    process.exit(1);
  }
  
  const files = fs.readdirSync(GALLERY_DIR);
  const imageFiles = files
    .filter(file => {
      const ext = path.extname(file).toLowerCase();
      return IMAGE_EXTENSIONS.includes(ext);
    })
    .map(file => `img/gallery/${file}`)
    .sort();
  
  console.log(`Found ${imageFiles.length} images`);
  return imageFiles;
}

function loadOrCreateMetadata() {
  if (fs.existsSync(METADATA_FILE)) {
    console.log('Loading existing metadata...');
    const content = fs.readFileSync(METADATA_FILE, 'utf8');
    return JSON.parse(content);
  } else {
    console.log('Creating new metadata file...');
    return { photos: {} };
  }
}

function updateMetadata(metadata, imageFiles) {
  console.log('Updating metadata...');
  
  let newPhotos = 0;
  
  // Add new photos to metadata (preserve existing captions)
  imageFiles.forEach(file => {
    if (!metadata.photos[file]) {
      metadata.photos[file] = {
        caption: '',
        date: ''
      };
      newPhotos++;
    }
  });
  
  // Remove photos that no longer exist
  const existingPhotos = Object.keys(metadata.photos);
  const removedPhotos = existingPhotos.filter(photo => !imageFiles.includes(photo));
  removedPhotos.forEach(photo => {
    console.log(`Removing deleted photo: ${photo}`);
    delete metadata.photos[photo];
  });
  
  console.log(`Added ${newPhotos} new photos, removed ${removedPhotos.length} deleted photos`);
  
  return metadata;
}

function saveMetadata(metadata) {
  console.log('Saving metadata...');
  fs.writeFileSync(METADATA_FILE, JSON.stringify(metadata, null, 2), 'utf8');
  console.log(`✓ Saved to ${METADATA_FILE}`);
}

function updateGalleryHTML(imageFiles) {
  console.log('Updating gallery.html...');
  
  const html = fs.readFileSync(GALLERY_HTML, 'utf8');
  
  // Generate the photos array
  const photosArray = imageFiles.map(f => `                    "${f}"`).join(',\n');
  const newPhotosCode = `photos = [\n${photosArray}\n                ];`;
  
  // Replace the hardcoded photos array in loadHardcodedPhotos()
  const updated = html.replace(
    /photos = \[\s*"img\/gallery\/[^;]+\];/s,
    newPhotosCode
  );
  
  if (updated === html) {
    console.log('⚠ Warning: Could not find photos array to update in gallery.html');
  } else {
    fs.writeFileSync(GALLERY_HTML, updated, 'utf8');
    console.log(`✓ Updated gallery.html with ${imageFiles.length} photos`);
  }
}

function main() {
  console.log('=== Gallery Update Script ===\n');
  
  // Scan directory for images
  const imageFiles = scanGalleryDirectory();
  
  // Load or create metadata
  const metadata = loadOrCreateMetadata();
  
  // Update metadata with new/removed photos
  const updatedMetadata = updateMetadata(metadata, imageFiles);
  
  // Save metadata
  saveMetadata(updatedMetadata);
  
  // Update gallery.html with new photo list
  updateGalleryHTML(imageFiles);
  
  console.log('\n✓ Gallery update complete!');
  console.log(`\nTo add captions, edit ${METADATA_FILE}`);
  console.log('Example:');
  console.log('  "img/gallery/photo.jpg": {');
  console.log('    "caption": "Sunset over the lake",');
  console.log('    "date": "2025-11-25"');
  console.log('  }');
}

main();
