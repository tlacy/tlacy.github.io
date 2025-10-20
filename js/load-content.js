// load-content.js — populate hero and basic site values from content.json
(async function(){
  try {
    const res = await fetch('content.json');
    const data = await res.json();
    if (!data) return;

    const name = data.name || '';
    const title = data.title || '';
    const bio = data.bio || '';
    const profileImage = data.profileImage || '';
    const resume = data.resume || '';

    const heroName = document.getElementById('hero-name');
    const heroTitle = document.getElementById('hero-title');
    const heroBio = document.getElementById('hero-bio');
    const profileImg = document.getElementById('profile-img');
    const resumeBtn = document.getElementById('resume-btn');
    const socialLinks = document.getElementById('social-links');

    if (heroName && name) heroName.textContent = name;
    if (heroTitle && title) heroTitle.textContent = title;
    if (heroBio && bio) heroBio.textContent = bio;
    if (profileImg && profileImage) profileImg.src = profileImage;
    if (resumeBtn && resume) {
      resumeBtn.href = resume;
      resumeBtn.removeAttribute('download');
    }

    if (socialLinks && data.social) {
      socialLinks.innerHTML = '';
      Object.keys(data.social).forEach(k => {
        const url = data.social[k];
        if (!url) return;
        const a = document.createElement('a');
        a.href = url; a.target = '_blank'; a.rel = 'noopener noreferrer';
        a.textContent = k;
        a.style.marginRight = '8px';
        socialLinks.appendChild(a);
      });
    }
  } catch (err) {
    console.warn('Could not load content.json', err);
  }
})();
