#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const argv = require('minimist')(process.argv.slice(2));

const CONTENT_FILE = path.resolve(__dirname, '..', 'content.json');

function usage() {
  console.error('Usage: node update-content.js --images images.json [--passion Photography]');
  process.exit(2);
}

function backup(originalPath) {
  const backupPath = originalPath + '.bak.' + Date.now();
  fs.copyFileSync(originalPath, backupPath);
  return backupPath;
}

function loadJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function saveJson(file, obj) {
  fs.writeFileSync(file, JSON.stringify(obj, null, 2) + '\n', 'utf8');
}

async function main() {
  const imagesFile = argv.images || argv.i || argv._[0];
  const passionName = argv.passion || 'Photography';
  if (!imagesFile) usage();

  const imagesPath = path.resolve(imagesFile);
  if (!fs.existsSync(imagesPath)) {
    console.error('Images file not found:', imagesPath);
    process.exit(1);
  }

  const images = loadJson(imagesPath);
  if (!Array.isArray(images) || images.length === 0) {
    console.error('Images file must contain a non-empty JSON array of image URLs');
    process.exit(1);
  }

  if (!fs.existsSync(CONTENT_FILE)) {
    console.error('content.json not found at', CONTENT_FILE);
    process.exit(1);
  }

  console.log('Backing up', CONTENT_FILE);
  const backupPath = backup(CONTENT_FILE);
  console.log('Backup created at', backupPath);

  const content = loadJson(CONTENT_FILE);
  if (!Array.isArray(content.passions)) content.passions = [];

  // Find the passion with the provided label
  let passion = content.passions.find(p => p.label === passionName || (p.label && p.label.toLowerCase() === passionName.toLowerCase()));
  if (!passion) {
    // create a new passion entry
    passion = { label: passionName, album: { images: [] } };
    content.passions.push(passion);
  }

  if (!passion.album) passion.album = { images: [] };
  passion.album.images = images;

  saveJson(CONTENT_FILE, content);
  console.log('Updated', CONTENT_FILE, 'with', images.length, 'images under passion', passionName);
}

if (require.main === module) main();
