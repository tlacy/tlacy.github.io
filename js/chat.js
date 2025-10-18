// Simple client-side sanitization for chat input
(function(){
  const input = document.getElementById('chat-input');
  const sendBtn = document.getElementById('send-btn');
  const chat = document.getElementById('chat');
  const MAX_LEN = 1000; // limit message length

  function stripHtmlTags(s){
    return s.replace(/<[^>]*>/g, '');
  }

  function removeUrls(s){
    // removes common URL patterns
    return s.replace(/https?:\/\/[\w\-\.\/%\?=&:#~+]+/gi, '')
            .replace(/www\.[\w\-\.\/%\?=&:#~+]+/gi,'');
  }

  function normalizeWhitespace(s){
    return s.replace(/\s+/g,' ').trim();
  }

  function sanitize(s){
    if (!s || typeof s !== 'string') return '';
    let out = s;
    out = stripHtmlTags(out);
    out = removeUrls(out);
    out = normalizeWhitespace(out);
    if (out.length > MAX_LEN) out = out.slice(0, MAX_LEN);
    return out;
  }

  function escapeHtml(s){
    return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }

  function appendMessage(text, who='visitor'){
    const p = document.createElement('p');
    p.className = 'chat-line ' + who;
    p.innerHTML = '<strong>' + escapeHtml(who) + ':</strong> ' + escapeHtml(text);
    chat.appendChild(p);
    chat.scrollTop = chat.scrollHeight;
  }

  sendBtn.addEventListener('click', ()=>{
    const raw = input.value;
    const clean = sanitize(raw);
    if (!clean) {
      alert('Please enter a short text message (no HTML or links).');
      return;
    }
    // Append locally
    appendMessage(clean, 'you');
    input.value = '';

    // For now, this page is client-only. If you wire it to a backend, ensure server-side
    // sanitization and rate-limiting. Do NOT send raw user input to downstream services.
  });

  // Prevent paste of rich content
  input.addEventListener('paste', (ev)=>{
    ev.preventDefault();
    const text = (ev.clipboardData || window.clipboardData).getData('text');
    const clean = sanitize(text);
    const start = input.selectionStart || 0;
    const end = input.selectionEnd || 0;
    const value = input.value;
    input.value = value.slice(0,start) + clean + value.slice(end);
  });
})();
