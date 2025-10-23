Netlify GitHub OAuth + commit functions (manage.html)

This repo includes simple Netlify Functions to enable in-browser editing of `content.json` and committing the change back to the GitHub repository using the user's GitHub account.

Files added under `netlify/functions/`:
- oauth_start.js — redirects the browser to GitHub's OAuth authorize URL
- oauth_callback.js — exchanges the code for an access token and redirects back to manage.html with the token in the fragment
- whoami.js — optional endpoint to verify who the token belongs to and whether they're authorized
- commit.js — commits a file (e.g. `content.json`) to the repo using the provided token

Setup steps
1. Host on Netlify (recommended) or another serverless host that supports functions.
2. Register a GitHub OAuth App:
   - Settings > Developer settings > OAuth Apps > New OAuth App
   - Authorization callback URL: https://<your-site>/api/oauth_callback or the Netlify function URL (for Netlify functions use: https://<your-site>/.netlify/functions/oauth_callback)
   - Note the Client ID and Client Secret.
3. Add environment variables to your Netlify site settings:
   - GITHUB_CLIENT_ID: your Client ID
   - GITHUB_CLIENT_SECRET: your Client Secret
   - SITE_URL: https://<your-site>
   - REPO_OWNER: tlacy
   - REPO_NAME: tlacy.github.io
   - ALLOWED_GITHUB_USERS: (optional) comma-separated usernames allowed to commit; if empty, any authenticated user can commit
4. Deploy the site to Netlify. The `manage.html` page has a "Sign in with GitHub" button that starts the flow.

Security notes
- The functions receive and use GitHub tokens to perform commits. Keep Client Secret secure as an environment variable on the server host.
- The callback returns the token in the URL fragment (not sent to the server) and then stored in sessionStorage in the browser. This keeps the token out of server logs.
- The `whoami` function can be used to enforce allowed users.

Limitations
- This is a minimal scaffold. You may want to:
  - Create PRs instead of committing directly to main.
  - Add server-side checks to ensure only authorized users can commit.
  - Add better error handling and feedback in the UI.

If you'd like, I can adapt the flow to create pull requests instead of direct commits, and add a small UI that shows commit history for the file.
