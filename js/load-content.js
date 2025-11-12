/**
 * load-content.js — Populate hero section and site metadata from content.json
 * 
 * This script loads the site's content configuration file (content.json) and populates
 * the hero section of the homepage with personalized information including name, title,
 * bio, profile image, resume link, and social media links.
 * 
 * Security: Uses DOMPurify to sanitize HTML content before rendering to prevent XSS attacks.
 * Falls back to textContent if DOMPurify is unavailable.
 */

// Immediately Invoked Function Expression (IIFE) to avoid polluting global scope
(async function(){
  try {
    // Fetch the content configuration file
    // Note: This is a static JSON file hosted with the site
    const res = await fetch('content.json');
    const data = await res.json();
    
    // Exit early if no data received
    if (!data) return;

    // Extract content fields with empty string defaults
    // This prevents 'undefined' from appearing in the UI
    const name = data.name || '';
    const title = data.title || '';23-
    const bio = data.bio || '';
    const profileImage = data.profileImage || '';
    const resume = data.resume || '';

    // Get references to DOM elements that will be populated
    const heroName = document.getElementById('hero-name');
    const heroTitle = document.getElementById('hero-title');
    const heroBio = document.getElementById('hero-bio');
    const profileImg = document.getElementById('profile-img');
    const resumeBtn = document.getElementById('resume-btn');
    const socialLinks = document.getElementById('social-links');

    // Populate name (plain text, no HTML)
    if (heroName && name) heroName.textContent = name;
    
    // Populate title/tagline (plain text, no HTML)
    if (heroTitle && title) heroTitle.textContent = title;
    
    // Populate bio with HTML sanitization
    // Bio can contain simple HTML formatting (line breaks, bold, etc.)
    if (heroBio && bio) {
      // Prefer DOMPurify for robust HTML sanitization
      if (window.DOMPurify && typeof DOMPurify.sanitize === 'function') {
        // DOMPurify removes dangerous HTML/JS while preserving safe formatting
        heroBio.innerHTML = DOMPurify.sanitize(bio);
      } else {
        // Fallback: treat as plain text to prevent XSS if DOMPurify unavailable
        heroBio.textContent = bio;
      }
    }
    
    // Update profile image source
    if (profileImg && profileImage) profileImg.src = profileImage;
    
    // Configure resume download button
    if (resumeBtn && resume) {
      resumeBtn.href = resume;
      // The download attribute prompts the browser to download rather than navigate
      resumeBtn.setAttribute('download', '');
    }

    // Build social media links dynamically
    // Expected format: data.social = { linkedin: "url", facebook: "url", ... }
    if (socialLinks && data.social) {
      // Clear any existing content
      socialLinks.innerHTML = '';
      
      // Iterate over social media platforms
      Object.keys(data.social).forEach(k => {
        const url = data.social[k];
        
        // Skip empty URLs
        if (!url) return;
        
        // Create link element
        const a = document.createElement('a');
        a.href = url;
        
        // Open in new tab for external links
        a.target = '_blank';
        
        // Security: prevent window.opener access and referrer leakage
        a.rel = 'noopener noreferrer';
        
        // Use platform name as link text (e.g., "linkedin")
        a.textContent = k;
        
        // Add spacing between links
        a.style.marginRight = '8px';
        
        // Add to container
        socialLinks.appendChild(a);
      });
    }
  } catch (err) {
    // Log error but don't block page rendering
    // If content.json fails to load, page shows default placeholder content
    console.warn('Could not load content.json', err);
  }
})();
