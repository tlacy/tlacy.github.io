// Simple lightbox for inline photo thumbnails
(function(){
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

  let lightbox = null;
  let currentIndex = 0;
  let images = [];

  function open(index){
    if(!lightbox) lightbox = createLightbox();
    images = Array.from(document.querySelectorAll('.photo-thumb')).map(n=>n.getAttribute('data-src'));
    currentIndex = index;
    render();
    lightbox.classList.add('open');
    document.body.style.overflow = 'hidden';
    lightbox.querySelector('.lb-close').focus();
  }

  function close(){
    if(!lightbox) return;
    lightbox.classList.remove('open');
    document.body.style.overflow = '';
  }

  function render(){
    if(!lightbox) return;
    const img = lightbox.querySelector('.lb-image');
    img.src = images[currentIndex] || '';
  }

  function next(){ currentIndex = (currentIndex + 1) % images.length; render(); }
  function prev(){ currentIndex = (currentIndex - 1 + images.length) % images.length; render(); }

  document.addEventListener('click', function(e){
    const t = e.target;
    if(t.classList && t.classList.contains('photo-thumb')){
      const idx = parseInt(t.getAttribute('data-index')||'0',10);
      open(idx);
    }
  });

  document.addEventListener('keydown', function(e){
    if(!lightbox || !lightbox.classList.contains('open')) return;
    if(e.key === 'Escape') close();
    if(e.key === 'ArrowRight') next();
    if(e.key === 'ArrowLeft') prev();
  });

  document.addEventListener('click', function(e){
    if(!lightbox) return;
    if(e.target.classList.contains('lb-close')) close();
    if(e.target.classList.contains('lb-backdrop')) close();
    if(e.target.classList.contains('lb-next')) next();
    if(e.target.classList.contains('lb-prev')) prev();
  });

})();
