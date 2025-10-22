// passion-tabs.js
// Renders passions as tabs and fetches feeds into each tab panel.

async function initPassionTabs() {
  try {
    const res = await fetch('content.json');
    const data = await res.json();
    const container = document.getElementById('passions-list');
    const feedsContainer = document.getElementById('feeds');
    container.innerHTML = '';
    feedsContainer.innerHTML = '';

    const tabsWrap = document.createElement('div');
    tabsWrap.className = 'tab-buttons';

    const panelsWrap = document.createElement('div');
    panelsWrap.className = 'panels-wrap';

    const images = {
      'Photography': 'img/bg-photography.svg',
      'Sports': 'img/bg-sports.svg',
      'Tech': 'img/bg-tech.svg',
      'People / Team Leadership': 'img/bg-leadership.svg'
    };

    const pastelMap = {
      'Photography': 'pastel-blue',
      'Sports': 'pastel-blue',
      'Tech': 'pastel-blue',
      'People / Team Leadership': 'pastel-purple'
    };

    // Roving tabindex pattern: only the active tab has tabindex=0, others -1
    (data.passions || []).forEach((p, idx) => {
      const btn = document.createElement('button');
      btn.textContent = p.label;
      btn.setAttribute('role', 'tab');
      btn.id = `tab-${idx}`;
      btn.setAttribute('aria-selected', idx === 0 ? 'true' : 'false');
      btn.setAttribute('tabindex', idx === 0 ? '0' : '-1');
      btn.setAttribute('aria-controls', `panel-${idx}`);
      btn.addEventListener('click', () => selectTab(idx));
      btn.addEventListener('keydown', (ev) => onKeydown(ev, idx));
      // Allow focus styling via keyboard
      btn.addEventListener('focus', () => btn.classList.add('focus'));
      btn.addEventListener('blur', () => btn.classList.remove('focus'));
      tabsWrap.appendChild(btn);

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

      // Preload first tab content
      if (idx === 0) {
        renderFeedInto(feedWrap, p);
      }
    });

    container.appendChild(tabsWrap);
    feedsContainer.appendChild(panelsWrap);

    function selectTab(i, moveFocusToPanel = true) {
      const buttons = Array.from(tabsWrap.querySelectorAll('button'));
      const panels = Array.from(panelsWrap.querySelectorAll('.tab-panel'));
      buttons.forEach((b, bi) => {
        const selected = bi === i;
        b.setAttribute('aria-selected', selected ? 'true' : 'false');
        b.setAttribute('tabindex', selected ? '0' : '-1');
        if (selected) b.focus && b.focus();
      });
      panels.forEach((p, pi) => {
        const active = pi === i;
        p.hidden = !active;
        if (active) {
          const feedDiv = p.querySelector('.feed-list');
          if (feedDiv && feedDiv.children.length === 0) {
            renderFeedInto(feedDiv, (data.passions || [])[i]);
          }
          // Move focus into the panel only when explicitly requested (keyboard activation)
          if (moveFocusToPanel) {
            // Delay focus to ensure browsers have revealed the panel
            setTimeout(() => p.focus && p.focus(), 0);
          }
        }
      });
    }

    function onKeydown(ev, idx) {
      const key = ev.key;
      const max = (data.passions || []).length - 1;
      if (key === 'ArrowRight') {
        ev.preventDefault();
        const next = Math.min(max, idx + 1);
        selectTab(next, false);
        tabsWrap.querySelectorAll('button')[next].focus();
      } else if (key === 'ArrowLeft') {
        ev.preventDefault();
        const prev = Math.max(0, idx - 1);
        selectTab(prev, false);
        tabsWrap.querySelectorAll('button')[prev].focus();
      } else if (key === 'Home') {
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
        const link = document.createElement('a');
        link.href = passion.album.url;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.className = 'album-link button';
        link.textContent = 'Open photo album';
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

    // Small HTML sanitizer - whitelist tags and safe attributes
    function escapeHtml(s){
      if(!s) return '';
      return String(s).replace(/[&<>"]/g, function(c){
        return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];
      });
    }

    function sanitizeHtml(input){
      if(!input) return '';
      // If DOMPurify is available, prefer it
      if(window.DOMPurify && typeof DOMPurify.sanitize === 'function'){
        return DOMPurify.sanitize(input);
      }
      // Fallback: very small sanitizer
      const wrapper = document.createElement('div');
      wrapper.innerHTML = input;
      const ALLOWED_TAGS = new Set(['P','BR','STRONG','EM','UL','OL','LI','A','H3','H4','B','I']);

      function clean(node){
        const nodeName = node.nodeName;
        if(node.nodeType === Node.TEXT_NODE) return;
        if(!ALLOWED_TAGS.has(nodeName)){
          const txt = document.createTextNode(node.textContent || '');
          node.parentNode.replaceChild(txt, node);
          return;
        }
        for(let i = node.attributes.length - 1; i >= 0; i--) {
          const attr = node.attributes[i].name;
          const val = node.getAttribute(attr);
          if(nodeName === 'A' && attr === 'href'){
            if(!/^https?:|^mailto:/i.test(val)){
              node.removeAttribute(attr);
            }
            continue;
          }
          node.removeAttribute(attr);
        }
        const children = Array.from(node.childNodes);
        children.forEach(clean);
      }

      const children = Array.from(wrapper.childNodes);
      children.forEach(child => {
        if(child.nodeType === Node.TEXT_NODE) return;
        clean(child);
      });
      return wrapper.innerHTML;
    }

  } catch (err) {
    console.warn('Failed to initialize passion tabs', err);
  }
}

document.addEventListener('DOMContentLoaded', initPassionTabs);
