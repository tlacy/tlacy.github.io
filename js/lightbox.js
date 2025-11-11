/**
 * lightbox.js — Simple lightbox modal for viewing inline photo thumbnails
 * 
 * This script provides a fullscreen photo viewer (lightbox) for gallery images.
 * Features:
 * - Click any .photo-thumb element to open lightbox
 * - Keyboard navigation (arrow keys, Escape)
 * - Previous/Next buttons
 * - Click outside image to close
 * 
 * Accessibility: Includes ARIA labels and keyboard support
 */

// IIFE to avoid polluting global scope
(function(){
  
  /**
   * Creates the lightbox DOM structure and returns the container element
   * Structure: backdrop + content container with close button, image, and nav controls
   * @returns {HTMLElement} The lightbox container element
   */
  function createLightbox(){
    const lb = document.createElement('div');
    lb.id = 'simple-lightbox';
    lb.innerHTML = `
      <div class="lb-backdrop" tabindex="-1"></div>
      <div class="lb-content" role="dialog" aria-modal="true">
        <button class="lb-close" aria-label="Close">×</button>
        <img class="lb-image" src="" alt="" />
        <div class="lb-controls">
          <button class="lb-prev" aria-label="Previous">‹</button>
          <button class="lb-next" aria-label="Next">›</button>
        </div>
      </div>
    `;
    document.body.appendChild(lb);
    return lb;
  }

  // Module-level state variables
  let lightbox = null;      // Reference to lightbox DOM element (lazy-created)
  let currentIndex = 0;     // Currently displayed image index
  let images = [];          // Array of image URLs from data-src attributes

  /**
   * Opens the lightbox and displays the image at the specified index
   * @param {number} index - Index of image to display in the images array
   */
  function open(index){
    // Lazy-create lightbox on first use
    if(!lightbox) lightbox = createLightbox();
    
    // Collect all photo thumbnail URLs from the page
    // Each .photo-thumb element should have a data-src attribute with full image URL
    images = Array.from(document.querySelectorAll('.photo-thumb'))
                  .map(n=>n.getAttribute('data-src'));
    
    // Set current index and render the image
    currentIndex = index;
    render();
    
    // Show lightbox with CSS class
    lightbox.classList.add('open');
    
    // Prevent page scrolling while lightbox is open
    document.body.style.overflow = 'hidden';
    
    // Focus on close button for keyboard accessibility
    lightbox.querySelector('.lb-close').focus();
  }

  /**
   * Closes the lightbox and restores page scrolling
   */
  function close(){
    if(!lightbox) return;
    
    // Hide lightbox
    lightbox.classList.remove('open');
    
    // Restore page scrolling
    document.body.style.overflow = '';
  }

  /**
   * Updates the lightbox image src to show the current index
   */
  function render(){
    if(!lightbox) return;
    const img = lightbox.querySelector('.lb-image');
    
    // Update image source (fallback to empty string if index out of bounds)
    img.src = images[currentIndex] || '';
  }

  /**
   * Advances to the next image (wraps to first if at end)
   */
  function next(){ 
    currentIndex = (currentIndex + 1) % images.length; 
    render(); 
  }
  
  /**
   * Goes back to the previous image (wraps to last if at beginning)
   */
  function prev(){ 
    currentIndex = (currentIndex - 1 + images.length) % images.length; 
    render(); 
  }

  // Event listener: Open lightbox when clicking a photo thumbnail
  document.addEventListener('click', function(e){
    const t = e.target;
    
    // Check if clicked element has the photo-thumb class
    if(t.classList && t.classList.contains('photo-thumb')){
      // Get the index from data-index attribute (set during render)
      const idx = parseInt(t.getAttribute('data-index')||'0',10);
      open(idx);
    }
  });

  // Event listener: Keyboard navigation when lightbox is open
  document.addEventListener('keydown', function(e){
    // Only handle keys when lightbox is visible
    if(!lightbox || !lightbox.classList.contains('open')) return;
    
    // Escape key closes lightbox
    if(e.key === 'Escape') close();
    
    // Arrow keys navigate between images
    if(e.key === 'ArrowRight') next();
    if(e.key === 'ArrowLeft') prev();
  });

  // Event listener: Handle clicks on lightbox controls
  document.addEventListener('click', function(e){
    if(!lightbox) return;
    
    // Close button clicked
    if(e.target.classList.contains('lb-close')) close();
    
    // Clicked on backdrop (outside image) - close lightbox
    if(e.target.classList.contains('lb-backdrop')) close();
    
    // Navigation button clicked
    if(e.target.classList.contains('lb-next')) next();
    if(e.target.classList.contains('lb-prev')) prev();
  });

})();
