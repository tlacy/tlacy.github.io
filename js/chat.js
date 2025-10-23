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
  // Simple non-blocking inline message element for user feedback
  const chatMessage = document.createElement('div');
  chatMessage.id = 'chat-message';
  chatMessage.style.cssText = 'color:#b71c1c;padding:6px 8px;margin:8px 0;display:none;border-radius:4px;background:rgba(183,28,28,0.06);font-size:0.95em;';
  const chatContainer = document.getElementById('chat-container') || document.body;
  chatContainer.insertBefore(chatMessage, chat);

  function showMessage(msg, timeout=3000){
    chatMessage.textContent = msg;
    chatMessage.style.display = 'block';
    clearTimeout(showMessage._t);
    showMessage._t = setTimeout(()=>{ chatMessage.style.display = 'none'; }, timeout);
  }

  sendBtn.addEventListener('click', ()=>{
    const raw = input.value;
    const clean = sanitize(raw);
    if (!clean) {
      showMessage('Please enter a short text message (no HTML or links).');
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
