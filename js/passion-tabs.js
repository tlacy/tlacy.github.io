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

    (data.passions || []).forEach((p, idx) => {
      const btn = document.createElement('button');
      btn.textContent = p.label;
      btn.setAttribute('role', 'tab');
      btn.id = `tab-${idx}`;
      btn.setAttribute('aria-selected', idx === 0 ? 'true' : 'false');
      btn.addEventListener('click', () => selectTab(idx));
      btn.addEventListener('keydown', (ev) => onKeydown(ev, idx));
      tabsWrap.appendChild(btn);

      const panel = document.createElement('div');
      panel.className = `tab-panel ${pastelMap[p.label] || ''}`;
      panel.id = `panel-${idx}`;
      panel.setAttribute('role', 'tabpanel');
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

    function selectTab(i) {
      const buttons = tabsWrap.querySelectorAll('button');
      const panels = panelsWrap.querySelectorAll('.tab-panel');
      buttons.forEach((b, bi) => b.setAttribute('aria-selected', bi === i ? 'true' : 'false'));
      panels.forEach((p, pi) => {
        p.hidden = pi !== i;
        if (pi === i) {
          const feedDiv = p.querySelector('.feed-list');
          if (feedDiv && feedDiv.children.length === 0) {
            renderFeedInto(feedDiv, (data.passions || [])[i]);
          }
          // move focus to the active panel for screen readers
          p.focus && p.focus();
        }
      });
    }

    function onKeydown(ev, idx) {
      const key = ev.key;
      const max = (data.passions || []).length - 1;
      if (key === 'ArrowRight') {
        ev.preventDefault();
        selectTab(Math.min(max, idx + 1));
        tabsWrap.querySelectorAll('button')[Math.min(max, idx + 1)].focus();
      } else if (key === 'ArrowLeft') {
        ev.preventDefault();
        selectTab(Math.max(0, idx - 1));
        tabsWrap.querySelectorAll('button')[Math.max(0, idx - 1)].focus();
      } else if (key === 'Home') {
        ev.preventDefault();
        selectTab(0);
        tabsWrap.querySelectorAll('button')[0].focus();
      } else if (key === 'End') {
        ev.preventDefault();
        selectTab(max);
        tabsWrap.querySelectorAll('button')[max].focus();
      }
    }

    async function renderFeedInto(container, passion) {
      container.innerHTML = '';
      if (!passion || !passion.feed) {
        container.innerHTML = `<p class="placeholder">No feed configured for ${passion.label}.</p>`;
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

  } catch (err) {
    console.warn('Failed to initialize passion tabs', err);
  }
}

document.addEventListener('DOMContentLoaded', initPassionTabs);
