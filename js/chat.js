/**
 * chat.js — Client-side chat input sanitization and message handling
 * 
 * This script provides a simple chat interface with aggressive input sanitization
 * to prevent XSS attacks and unwanted content. All user input is sanitized before
 * display, removing HTML tags, URLs, and normalizing whitespace.
 * 
 * Security Features:
 * - Strips all HTML tags to prevent XSS
 * - Removes URLs to prevent phishing links
 * - Limits message length to 1000 characters
 * - Escapes HTML entities before rendering
 * - Prevents rich-text paste attacks
 * 
 * NOTE: This is client-side only. If connected to a backend, implement
 * server-side sanitization and rate limiting as well.
 */

// IIFE to avoid polluting global scope
(function(){
  // Get references to DOM elements
  const input = document.getElementById('chat-input');
  const sendBtn = document.getElementById('send-btn');
  const chat = document.getElementById('chat');
  
  // Maximum allowed message length (prevents abuse)
  const MAX_LEN = 1000;

  /**
   * Removes all HTML tags from a string
   * Example: "<script>alert(1)</script>test" => "alert(1)test"
   * @param {string} s - Input string potentially containing HTML
   * @returns {string} String with all HTML tags removed
   */
  function stripHtmlTags(s){
    return s.replace(/<[^>]*>/g, '');
  }

  /**
   * Removes common URL patterns from a string
   * Prevents users from posting clickable or misleading links
   * @param {string} s - Input string potentially containing URLs
   * @returns {string} String with URLs removed
   */
  function removeUrls(s){
    // Remove http(s):// URLs
    return s.replace(/https?:\/\/[\w\-\.\/%\?=&:#~+]+/gi, '')
            // Remove www. URLs
            .replace(/www\.[\w\-\.\/%\?=&:#~+]+/gi,'');
  }

  /**
   * Normalizes all whitespace to single spaces and trims
   * Prevents visual formatting tricks and excessive spacing
   * @param {string} s - Input string with potentially excessive whitespace
   * @returns {string} String with normalized whitespace
   */
  function normalizeWhitespace(s){
    return s.replace(/\s+/g,' ').trim();
  }

  /**
   * Comprehensive input sanitization pipeline
   * Applies all sanitization steps and enforces length limit
   * @param {string} s - Raw user input
   * @returns {string} Sanitized string safe for display
   */
  function sanitize(s){
    // Reject non-string or empty input
    if (!s || typeof s !== 'string') return '';
    
    let out = s;
    
    // Step 1: Remove all HTML tags (XSS prevention)
    out = stripHtmlTags(out);
    
    // Step 2: Remove URLs (phishing prevention)
    out = removeUrls(out);
    
    // Step 3: Normalize whitespace (formatting abuse prevention)
    out = normalizeWhitespace(out);
    
    // Step 4: Enforce maximum length (abuse prevention)
    if (out.length > MAX_LEN) out = out.slice(0, MAX_LEN);
    
    return out;
  }

  /**
   * Escapes HTML special characters to prevent rendering as HTML
   * Used before inserting user content into innerHTML
   * @param {string} s - String to escape
   * @returns {string} HTML-safe string with entities escaped
   */
  function escapeHtml(s){
    return s.replace(/&/g,'&amp;')
            .replace(/</g,'&lt;')
            .replace(/>/g,'&gt;');
  }

  /**
   * Appends a message to the chat display
   * @param {string} text - The message text (must be pre-sanitized)
   * @param {string} who - Username or identifier ('visitor', 'you', etc.)
   */
  function appendMessage(text, who='visitor'){
    const p = document.createElement('p');
    p.className = 'chat-line ' + who;
    
    // Use innerHTML with escaped content for formatting
    // Both 'who' and 'text' are escaped to prevent any HTML injection
    p.innerHTML = '<strong>' + escapeHtml(who) + ':</strong> ' + escapeHtml(text);
    
    chat.appendChild(p);
    
    // Auto-scroll to bottom to show new message
    chat.scrollTop = chat.scrollHeight;
  }
  
  /**
   * Create and insert a non-blocking inline message element for user feedback
   * This provides error/warning messages without blocking the UI with alerts
   */
  const chatMessage = document.createElement('div');
  chatMessage.id = 'chat-message';
  chatMessage.style.cssText = 'color:#b71c1c;padding:6px 8px;margin:8px 0;display:none;border-radius:4px;background:rgba(183,28,28,0.06);font-size:0.95em;';
  
  const chatContainer = document.getElementById('chat-container') || document.body;
  chatContainer.insertBefore(chatMessage, chat);

  /**
   * Displays a temporary message to the user (non-blocking alternative to alert())
   * @param {string} msg - The message to display
   * @param {number} timeout - How long to show message in milliseconds (default: 3000)
   */
  function showMessage(msg, timeout=3000){
    chatMessage.textContent = msg;
    chatMessage.style.display = 'block';
    
    // Clear any existing timeout
    clearTimeout(showMessage._t);
    
    // Hide message after timeout
    showMessage._t = setTimeout(()=>{ 
      chatMessage.style.display = 'none'; 
    }, timeout);
  }

  /**
   * Event handler for Send button click
   * Validates, sanitizes, and displays user message
   */
  sendBtn.addEventListener('click', ()=>{
    // Get raw input value
    const raw = input.value;
    
    // Sanitize the input
    const clean = sanitize(raw);
    
    // Reject empty or whitespace-only messages
    if (!clean) {
      showMessage('Please enter a short text message (no HTML or links).');
      return;
    }
    
    // Append message to chat display
    appendMessage(clean, 'you');
    
    // Clear input field
    input.value = '';

    // IMPORTANT: This is a client-only demo. 
    // If you connect this to a backend API, ensure:
    // 1. Server-side input validation and sanitization
    // 2. Rate limiting to prevent spam/abuse  
    // 3. NEVER send raw user input to downstream services
    // 4. Log and monitor for abuse patterns
  });

  /**
   * Event handler for paste events
   * Prevents paste of rich-text content (images, formatting, HTML, etc.)
   * Only allows plain text paste with sanitization
   */
  input.addEventListener('paste', (ev)=>{
    // Prevent default paste behavior
    ev.preventDefault();
    
    // Extract plain text from clipboard data
    const text = (ev.clipboardData || window.clipboardData).getData('text');
    
    // Sanitize the pasted text
    const clean = sanitize(text);
    
    // Get current cursor position in input
    const start = input.selectionStart || 0;
    const end = input.selectionEnd || 0;
    const value = input.value;
    
    // Insert sanitized text at cursor position
    // This replaces any selected text or inserts at cursor
    input.value = value.slice(0,start) + clean + value.slice(end);
  });
  
})();
