# Security Review - tomlacy.net

**Date:** November 6, 2025  
**Reviewer:** AI Security Analysis

## Executive Summary

This static GitHub Pages site has been reviewed for security vulnerabilities. Overall, the site follows good security practices for a static website with client-side JavaScript. Several recommendations are provided to further enhance security.

## Security Strengths

1. ✅ **HTML Sanitization**: Uses DOMPurify library with fallback sanitization
2. ✅ **XSS Protection**: Content from content.json is sanitized before rendering
3. ✅ **No Sensitive Data**: No API keys or credentials in client code
4. ✅ **Input Validation**: Chat and form inputs are sanitized
5. ✅ **External Link Security**: Uses `rel="noopener noreferrer"` on external links
6. ✅ **HTTPS Only**: Site served via GitHub Pages with HTTPS
7. ✅ **No Direct Database**: Static site architecture limits attack surface

## Security Findings & Recommendations

### CRITICAL - manage.html Authentication

**Issue**: The manage.html page uses client-side password validation that can be easily bypassed.

```javascript
const DEFAULT_PASSWORD = 'tomalacy'; // visible in client code!
```

**Risk**: HIGH - Anyone can view source and bypass the login

**Recommendations**:
1. **Remove manage.html from production** - Only use locally or behind server-side authentication
2. Add to `.gitignore` or use a separate private repository for management tools
3. If GitHub OAuth is used, ensure ALLOWED_GITHUB_USERS is configured on server
4. Consider using HTTP Basic Auth via .htaccess (if supported by hosting)

**Fix Applied**: Add warning comment explaining the security limitation

---

### MEDIUM - Content Injection via content.json

**Issue**: Site renders content from content.json without server-side validation

**Risk**: MEDIUM - If content.json is compromised, malicious HTML/JS could be injected

**Current Mitigation**: DOMPurify sanitization is used, which is good

**Recommendations**:
1. ✅ Already using DOMPurify - keep this
2. Add Content Security Policy (CSP) headers
3. Validate content.json schema in CI/CD before deployment
4. Consider using Subresource Integrity (SRI) for external scripts

**Fix**: Add CSP meta tag to index.html

---

### MEDIUM - Third-Party Dependencies

**Issue**: Site loads external scripts from CDNs

**Affected Files**:
- React from unpkg.com (currently unused in production)
- DOMPurify from cdnjs (fallback only)
- Google Analytics (currently disabled with placeholder ID)

**Risk**: MEDIUM - CDN compromise could inject malicious code

**Recommendations**:
1. ✅ Use local vendor copies (already done for DOMPurify)
2. ❌ Remove unused React libraries from index.html
3. Add Subresource Integrity (SRI) hashes to all external scripts
4. Update Google Analytics ID or remove the script entirely

**Example SRI**:
```html
<script 
  src="https://cdnjs.cloudflare.com/ajax/libs/dompurify/2.4.0/purify.min.js"
  integrity="sha512-example-hash"
  crossorigin="anonymous">
</script>
```

---

### LOW - RSS Feed Proxy

**Issue**: Site uses third-party RSS-to-JSON proxy (rss2json.com)

**Risk**: LOW - Service could be compromised or go offline

**Recommendations**:
1. Add error handling (✅ already present)
2. Limit displayed content (✅ already filtered to 30 days, 6 items)
3. Consider self-hosting RSS proxy or using GitHub Actions to pre-fetch
4. Add rate limiting detection

---

### LOW - Information Disclosure

**Issue**: Detailed error messages and console.warn statements in production

**Examples**:
- `console.warn('Could not load content.json', err)`
- `console.warn('Failed to initialize passion tabs', err)`

**Risk**: LOW - Provides debugging info to potential attackers

**Recommendations**:
1. Use production vs development environment detection
2. Only log detailed errors in development
3. Show user-friendly error messages in production

**Example Fix**:
```javascript
if (process.env.NODE_ENV !== 'production') {
  console.warn('Could not load content.json', err);
}
```

---

### LOW - Directory Listing

**Issue**: gallery.html attempts to fetch directory listing

**Risk**: LOW - May expose server configuration

**Current Mitigation**: Falls back to hardcoded list, which is fine

**Recommendation**: Keep current approach (fallback list)

---

## Content Security Policy Recommendation

Add the following CSP meta tag to all HTML files:

```html
<meta http-equiv="Content-Security-Policy" 
      content="default-src 'self'; 
               script-src 'self' 'unsafe-inline' https://unpkg.com https://cdnjs.cloudflare.com https://www.google-analytics.com; 
               style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; 
               font-src 'self' https://fonts.gstatic.com; 
               img-src 'self' data: https:; 
               connect-src 'self' https://api.rss2json.com; 
               frame-ancestors 'none';
               base-uri 'self';
               form-action 'self';">
```

**Note**: Remove 'unsafe-inline' gradually by moving inline scripts to external files

---

## Privacy Considerations

1. ✅ Google Analytics is disabled (UA-XXXXX-X placeholder)
2. ✅ IP collection script removed (noted in index.html)
3. ✅ No tracking pixels or third-party analytics
4. ❌ RSS proxy (rss2json.com) may log visitor IPs

**Recommendation**: Add privacy policy if collecting any user data via forms

---

## Input Validation Summary

| Input Point | Validation | Sanitization | Status |
|-------------|-----------|--------------|--------|
| content.json bio | ✅ | DOMPurify | ✅ Good |
| chat input | ✅ | stripHtml, removeUrls | ✅ Good |
| manage.html textareas | ❌ | None (local only) | ⚠️ Warning added |
| people content | ✅ | DOMPurify | ✅ Good |
| RSS feed content | ✅ | Sanitized titles | ✅ Good |

---

## Recommended Actions (Priority Order)

1. **HIGH**: Remove or secure manage.html (add to .gitignore or use server auth)
2. **HIGH**: Remove unused React scripts from index.html
3. **MEDIUM**: Add Content Security Policy meta tags
4. **MEDIUM**: Add SRI to external scripts
5. **MEDIUM**: Update or remove Google Analytics placeholder
6. **LOW**: Reduce console logging in production
7. **LOW**: Add privacy policy page

---

## Compliance Notes

- **GDPR**: No personal data collected (if GA is disabled)
- **WCAG**: Good accessibility practices (ARIA labels, keyboard navigation)
- **OWASP**: Follows OWASP secure coding guidelines for static sites

---

## Conclusion

The site is **reasonably secure** for a static website. The main risk is the client-side authentication in manage.html, which should not be relied upon for security. Implementing the recommended CSP headers and removing unused dependencies will further improve the security posture.

**Overall Risk Rating**: MEDIUM (with manage.html), LOW (without manage.html in production)

---

## Testing Recommendations

1. Run OWASP ZAP scan on production site
2. Test XSS payloads in content.json locally
3. Verify CSP policy doesn't break functionality
4. Check for mixed content warnings
5. Validate all external links are HTTPS
