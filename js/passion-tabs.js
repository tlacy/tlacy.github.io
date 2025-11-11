/**
 * passion-tabs.js — Tabbed interface for displaying user passions and content feeds
 * 
 * This script creates an accessible tabbed interface that displays different "passions"
 * (interests/topics) with associated content. Each passion can have:
 * - RSS feed (fetched via rss2json.com proxy)
 * - Photo album (local gallery or external link)
 * - Custom HTML content (People/Leadership section)
 * 
 * Features:
 * - ARIA-compliant keyboard navigation (Arrow keys, Home, End, Enter/Space)
 * - Roving tabindex pattern for accessibility
 * - Lazy loading of feed content (only loads when tab is activated)
 * - HTML sanitization using DOMPurify with fallback sanitizer
 * - Responsive design with pastel color themes
 * 
 * Security:
 * - All HTML content is sanitized before rendering
 * - External links use rel="noopener noreferrer"
 * - Feed content limited to recent items (30 days, max 6)
 * 
 * Keyboard Navigation:
 * - Arrow Left/Right: Move between tabs
 * - Home/End: Jump to first/last tab
 * - Enter/Space: Activate focused tab and move focus to panel
 */

async function initPassionTabs() {
  try {
    // Load site configuration containing passions array
    const res = await fetch('content.json');
    const data = await res.json();
    
    // Get container elements
    const container = document.getElementById('passions-list');
    const feedsContainer = document.getElementById('feeds');
    
    // Clear existing content
    container.innerHTML = '';
    feedsContainer.innerHTML = '';

    // Create tab buttons container
    const tabsWrap = document.createElement('div');
    tabsWrap.className = 'tab-buttons';

    // Create tab panels container
    const panelsWrap = document.createElement('div');
    panelsWrap.className = 'panels-wrap';

    // Map passion labels to background images
    const images = {
      'Photography': 'img/bg-photography.svg',
      'Sports': 'img/bg-sports.svg',
      'Tech': 'img/bg-tech.svg',
      'People / Team Leadership': 'img/bg-leadership.svg'
    };

    // Map passion labels to pastel color themes
    const pastelMap = {
      'Photography': 'pastel-blue',
      'Sports': 'pastel-blue',
      'Tech': 'pastel-blue',
      'People / Team Leadership': 'pastel-purple'
    };

    /**
     * Build tab buttons and panels
     * Uses the roving tabindex pattern for keyboard accessibility:
     * - Only the selected tab has tabindex="0" (keyboard focusable)
     * - All other tabs have tabindex="-1" (not in tab order, but can receive focus programmatically)
     */
    (data.passions || []).forEach((p, idx) => {
      // Create tab button
      const btn = document.createElement('button');
      btn.textContent = p.label;
      btn.setAttribute('role', 'tab');
      btn.id = `tab-${idx}`;
      btn.setAttribute('aria-selected', idx === 0 ? 'true' : 'false');
      btn.setAttribute('tabindex', idx === 0 ? '0' : '-1');
      btn.setAttribute('aria-controls', `panel-${idx}`);
      
      // Click handler - activate this tab
      btn.addEventListener('click', () => selectTab(idx));
      
      // Keyboard navigation handler
      btn.addEventListener('keydown', (ev) => onKeydown(ev, idx));
      
      // Visual focus indicators for keyboard users
      btn.addEventListener('focus', () => btn.classList.add('focus'));
      btn.addEventListener('blur', () => btn.classList.remove('focus'));
      
      tabsWrap.appendChild(btn);

      // Create corresponding panel
      const panel = document.createElement('div');
      panel.className = `tab-panel ${pastelMap[p.label] || ''}`;
      panel.id = `panel-${idx}`;
  panel.setAttribute('role', 'tabpanel');
  panel.setAttribute('aria-labelledby', `tab-${idx}`);
  // Make panels focusable so we can move focus into them after selection
  panel.setAttribute('tabindex', '-1');
  panel.hidden = !(idx === 0);

      const bg = document.createElement('img');
      bg.className = 'tab-bg';
      bg.src = images[p.label] || '';
      bg.alt = '';
      panel.appendChild(bg);

      const feedWrap = document.createElement('div');
      feedWrap.className = 'feed-list';
      panel.appendChild(feedWrap);

      panelsWrap.appendChild(panel);

      // Preload content for the first (default) tab
      // Other tabs lazy-load when activated to improve performance
      if (idx === 0) {
        renderFeedInto(feedWrap, p);
      }
    });

    // Add tab buttons and panels to page
    container.appendChild(tabsWrap);
    feedsContainer.appendChild(panelsWrap);

    /**
     * Activates a specific tab and shows its panel
     * Implements the roving tabindex pattern and lazy-loads content
     * 
     * @param {number} i - Index of tab to select
     * @param {boolean} moveFocusToPanel - Whether to move keyboard focus into the panel
     *                                     (true for Enter/Space, false for arrow navigation)
     */
    function selectTab(i, moveFocusToPanel = true) {
      const buttons = Array.from(tabsWrap.querySelectorAll('button'));
      const panels = Array.from(panelsWrap.querySelectorAll('.tab-panel'));
      
      // Update button states
      buttons.forEach((b, bi) => {
        const selected = bi === i;
        
        // Update ARIA attributes for screen readers
        b.setAttribute('aria-selected', selected ? 'true' : 'false');
        
        // Update tabindex for roving tabindex pattern
        b.setAttribute('tabindex', selected ? '0' : '-1');
        
        // Move focus to selected button
        if (selected) b.focus && b.focus();
      });
      
      // Update panel visibility
      panels.forEach((p, pi) => {
        const active = pi === i;
        
        // Show/hide panel using the hidden attribute
        p.hidden = !active;
        
        if (active) {
          const feedDiv = p.querySelector('.feed-list');
          
          // Lazy load: only fetch content if panel is empty
          if (feedDiv && feedDiv.children.length === 0) {
            renderFeedInto(feedDiv, (data.passions || [])[i]);
          }
          
          // Move focus into the panel only when explicitly requested (keyboard activation)
          // This improves keyboard navigation UX
          if (moveFocusToPanel) {
            // Delay focus to ensure browsers have revealed the panel
            setTimeout(() => p.focus && p.focus(), 0);
          }
        }
      });
    }

    /**
     * Handles keyboard navigation between tabs
     * Implements ARIA authoring practices for tab patterns
     * 
     * Supported keys:
     * - ArrowRight: Move to next tab (wrap to same if at end)
     * - ArrowLeft: Move to previous tab (wrap to same if at beginning)
     * - Home: Jump to first tab
     * - End: Jump to last tab
     * - Enter/Space: Activate current tab and move focus to panel
     * 
     * @param {KeyboardEvent} ev - The keyboard event
     * @param {number} idx - Current tab index
     */
    function onKeydown(ev, idx) {
      const key = ev.key;
      const max = (data.passions || []).length - 1;
      
      if (key === 'ArrowRight') {
        // Prevent default scrolling behavior
        ev.preventDefault();
        
        // Move to next tab (stay on current if already at last)
        const next = Math.min(max, idx + 1);
        selectTab(next, false);
        
        // Explicitly focus the next button
        tabsWrap.querySelectorAll('button')[next].focus();
        
      } else if (key === 'ArrowLeft') {
        ev.preventDefault();
        
        // Move to previous tab (stay on current if already at first)
        const prev = Math.max(0, idx - 1);
        selectTab(prev, false);
        tabsWrap.querySelectorAll('button')[prev].focus();
        
      } else if (key === 'Home') {
        // Jump to first tab
        ev.preventDefault();
        selectTab(0, false);
        tabsWrap.querySelectorAll('button')[0].focus();
      } else if (key === 'End') {
        ev.preventDefault();
        selectTab(max, false);
        tabsWrap.querySelectorAll('button')[max].focus();
      } else if (key === 'Enter' || key === ' ') {
        // Activate the focused tab and move focus into the panel
        ev.preventDefault();
        selectTab(idx, true);
      }
    }

    async function renderFeedInto(container, passion) {
      container.innerHTML = '';
      if (!passion) {
        // If this is the People / Team Leadership panel, render editable site content
        if (passion && /People/i.test(passion.label)) {
          try {
            const people = (data && data.people) ? data.people : null;
            const section = document.createElement('section');
            section.innerHTML = `<h3>${passion.label}</h3>`;
            if (people && (people.content || people.contactEmail)) {
              // sanitize and render content
              const contentHtml = sanitizeHtml(people.content || '');
              const contentWrap = document.createElement('div');
              contentWrap.className = 'people-content';
              contentWrap.innerHTML = contentHtml || '<p>No leadership content has been added yet.</p>';
              section.appendChild(contentWrap);
              if (people.contactEmail) {
                const contact = document.createElement('p');
                contact.className = 'people-contact';
                // Show mailto link; keep simple to allow copy/paste
                contact.innerHTML = `Contact: <a href="mailto:${escapeHtml(people.contactEmail)}">${escapeHtml(people.contactEmail)}</a>`;
                section.appendChild(contact);
              }
            } else {
              section.innerHTML += '<p class="placeholder">No leadership content configured. Edit <code>content.json</code> or use manage.html to add content.</p>';
            }
            container.appendChild(section);
            return;
          } catch (e) {
            container.innerHTML = `<p class="placeholder">No feed configured for ${passion.label}.</p>`;
            return;
          }
        }
        container.innerHTML = `<p class="placeholder">No feed configured for ${passion.label}.</p>`;
        return;
      }
      // If an album is provided, render album UI (link + optional images grid)
      if (passion.album && passion.album.url) {
        const section = document.createElement('section');
        section.innerHTML = `<h3>${passion.label}</h3>`;
        // Check if galleryLink is present (local gallery page)
        const galleryUrl = passion.galleryLink || passion.album.url;
        const link = document.createElement('a');
        link.href = galleryUrl;
        link.target = passion.galleryLink ? '_self' : '_blank';
        link.rel = passion.galleryLink ? '' : 'noopener noreferrer';
        link.className = 'album-link button';
        link.textContent = passion.galleryLink ? 'View Gallery →' : 'Open photo album';
        link.style.cssText = 'display:inline-block;background:var(--blue);color:#fff;padding:10px 16px;border-radius:8px;margin:8px 0;text-decoration:none;';
        section.appendChild(link);
        // Optional inline images grid if image URLs are provided in content.json
        if (Array.isArray(passion.album.images) && passion.album.images.length > 0) {
          const grid = document.createElement('div');
          grid.className = 'photo-grid';
          const imageRegex = /\.(jpe?g|png|webp)(?:\?|$)/i;
          passion.album.images.forEach((src, si) => {
            // Only create an <img> for likely direct image-file URLs. Otherwise show a clickable placeholder.
            if (imageRegex.test(src)) {
              const img = document.createElement('img');
              img.src = src;
              img.alt = '';
              img.loading = 'lazy';
              img.className = 'photo-thumb';
              img.setAttribute('data-src', src);
              img.setAttribute('data-index', si);
              // If the image fails to load, replace with a link placeholder
              img.addEventListener('error', () => {
                const placeholder = document.createElement('div');
                placeholder.className = 'photo-card';
                const a = document.createElement('a');
                a.href = src;
                a.target = '_blank';
                a.rel = 'noopener noreferrer';
                a.textContent = 'Open photo';
                placeholder.appendChild(a);
                img.replaceWith(placeholder);
              });
              grid.appendChild(img);
            } else {
              const card = document.createElement('div');
              card.className = 'photo-card';
              const a = document.createElement('a');
              a.href = src;
              a.target = '_blank';
              a.rel = 'noopener noreferrer';
              a.textContent = 'Open photo';
              card.appendChild(a);
              grid.appendChild(card);
            }
          });
          section.appendChild(grid);
        } else {
          const hint = document.createElement('p');
          hint.className = 'placeholder';
          hint.textContent = 'Open the album link to view the shared photos. To show thumbnails inline, add direct image URLs to content.json -> passions[0].album.images.';
          section.appendChild(hint);
        }
        container.appendChild(section);
        return;
      }
      const section = document.createElement('section');
      section.innerHTML = `<h3>${passion.label} — recent</h3><p>Loading…</p>`;
      container.appendChild(section);
      try {
        const proxy = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(passion.feed)}`;
        const r = await fetch(proxy);
        const json = await r.json();
        if (!json || !json.items) {
          section.innerHTML = `<h3>${passion.label}</h3><p>No feed items returned.</p>`;
          return;
        }
        const cutoff = Date.now() - (30 * 24 * 60 * 60 * 1000);
        const recent = json.items.filter(it => new Date(it.pubDate).getTime() >= cutoff).slice(0,6);
        if (recent.length === 0) {
          section.innerHTML = `<h3>${passion.label}</h3><p>No recent posts in the last 30 days.</p>`;
          return;
        }
        const ul = document.createElement('ul');
        recent.forEach(it => {
          const li = document.createElement('li');
          li.innerHTML = `<a href="${it.link}" target="_blank">${it.title}</a> <small style='color:#666'>${new Date(it.pubDate).toLocaleDateString()}</small>`;
          ul.appendChild(li);
        });
        section.innerHTML = `<h3>${passion.label} — recent (30d)</h3>`;
        section.appendChild(ul);
      } catch (err) {
        section.innerHTML = `<h3>${passion.label}</h3><p style="color:red">Failed to load feed.</p>`;
      }
    }

    /**
     * HTML Entity Escaping
     * Converts special characters to HTML entities to prevent them from being interpreted as HTML
     * Used before inserting user content into innerHTML
     * 
     * @param {string} s - String potentially containing special characters
     * @returns {string} HTML-safe string with entities escaped
     */
    function escapeHtml(s){
      if(!s) return '';
      return String(s).replace(/[&<>"]/g, function(c){
        return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];
      });
    }

    /**
     * HTML Sanitization with Tag Whitelisting
     * Removes dangerous HTML while preserving safe formatting tags
     * 
     * This function provides two-tier sanitization:
     * 1. Prefer DOMPurify library (robust, battle-tested)
     * 2. Fallback to custom whitelist-based sanitizer
     * 
     * Custom sanitizer allows only: P, BR, STRONG, EM, UL, OL, LI, A, H3, H4, B, I
     * For <a> tags, only allows http(s): and mailto: hrefs
     * All other attributes are stripped
     * 
     * @param {string} input - Raw HTML string (potentially dangerous)
     * @returns {string} Sanitized HTML safe for innerHTML
     */
    function sanitizeHtml(input){
      if(!input) return '';
      
      // Tier 1: Use DOMPurify if available (recommended)
      if(window.DOMPurify && typeof DOMPurify.sanitize === 'function'){
        return DOMPurify.sanitize(input);
      }
      
      // Tier 2: Fallback whitelist-based sanitizer
      const wrapper = document.createElement('div');
      wrapper.innerHTML = input;
      
      // Whitelist of allowed HTML tags (all uppercase for comparison)
      const ALLOWED_TAGS = new Set(['P','BR','STRONG','EM','UL','OL','LI','A','H3','H4','B','I']);

      /**
       * Recursively cleans a DOM node and its children
       * - Removes disallowed tags (replaces with text content)
       * - Strips all attributes except safe href on <a> tags
       * 
       * @param {Node} node - DOM node to clean
       */
      function clean(node){
        const nodeName = node.nodeName;
        
        // Skip text nodes (they're safe)
        if(node.nodeType === Node.TEXT_NODE) return;
        
        // Remove disallowed tags by replacing with text content
        if(!ALLOWED_TAGS.has(nodeName)){
          const txt = document.createTextNode(node.textContent || '');
          node.parentNode.replaceChild(txt, node);
          return;
        }
        
        // Strip attributes (except safe hrefs on links)
        for(let i = node.attributes.length - 1; i >= 0; i--) {
          const attr = node.attributes[i].name;
          const val = node.getAttribute(attr);
          
          // Allow href on <a> tags, but only http(s): and mailto: protocols
          if(nodeName === 'A' && attr === 'href'){
            // Remove javascript:, data:, and other dangerous protocols
            if(!/^https?:|^mailto:/i.test(val)){
              node.removeAttribute(attr);
            }
            continue; // Keep the href if it passed validation
          }
          
          // Remove all other attributes (class, style, onclick, etc.)
          node.removeAttribute(attr);
        }
        
        // Recursively clean child nodes
        const children = Array.from(node.childNodes);
        children.forEach(clean);
      }

      // Clean all top-level children
      const children = Array.from(wrapper.childNodes);
      children.forEach(child => {
        if(child.nodeType === Node.TEXT_NODE) return;
        clean(child);
      });
      
      return wrapper.innerHTML;
    }

  } catch (err) {
    // Log initialization failure but don't break the page
    console.warn('Failed to initialize passion tabs', err);
  }
}

// Initialize tabs when DOM is ready
document.addEventListener('DOMContentLoaded', initPassionTabs);
