DNS setup for tomlacy.net
=========================

This document explains how to configure DNS so `www.tomlacy.net` is served by GitHub Pages with HTTPS, and how to optionally handle the apex domain `tomlacy.net`.

1) Primary site: www.tomlacy.net

- In your DNS provider, create a CNAME record for the host `www` pointing to `tlacy.github.io.` (note the trailing dot is optional in most UIs).
- Example:

  Type: CNAME
  Name: www
  Value: tlacy.github.io
  TTL: default (e.g., 300)

- In the repository, `CNAME` should contain a single canonical hostname: `www.tomlacy.net` (already set).
- Once the CNAME is in place and your repo's Pages settings are configured to use the custom domain, GitHub will request and provision an HTTPS certificate for `www.tomlacy.net`. This can take a few minutes to a few hours the first time.

Verification commands (run locally):

```bash
# follow redirects and show final status and URL
curl -I -L -sS -o /dev/null -w "%{http_code} %{url_effective}\n" https://www.tomlacy.net

# inspect the served TLS certificate
echo | openssl s_client -servername www.tomlacy.net -connect www.tomlacy.net:443 2>/dev/null | sed -n '1,120p'
```

2) Optional apex handling: tomlacy.net

GitHub Pages recommends serving a custom domain from either the `www` subdomain or the apex; supporting both with valid HTTPS requires DNS configuration.

Two common approaches:

a) Redirect apex -> www (recommended):

- Configure a redirect at your DNS provider so `tomlacy.net` redirects (HTTP 301) to `https://www.tomlacy.net`.
- Many registrars offer "URL forwarding" or "web forwarding" which performs this redirect for you. Set the target to `https://www.tomlacy.net`.
- Advantages: simple, avoids complex apex DNS records; single certificate for `www`.

b) Add apex to GitHub Pages and use ALIAS/ANAME or A records:

- If you want `tomlacy.net` to be served directly by GitHub Pages, add `tomlacy.net` as an additional custom domain in the Pages settings UI. GitHub will still maintain a `CNAME` file with the primary domain; the second domain is tracked in the Pages settings.
- For apex DNS records, use either the GitHub Pages A records (if supported by your provider) or ALIAS/ANAME pointing to `tlacy.github.io` (some providers support ALIAS for apex records). GitHub Pages A records (example) are:

  185.199.108.153
  185.199.109.153
  185.199.110.153
  185.199.111.153

- Notes: TLS provisioning for the apex requires correct DNS. If your DNS returns a mismatched certificate, remove the apex from Pages settings and use the redirect approach instead.

3) Troubleshooting

- If `curl` reports an SSL hostname mismatch for `tomlacy.net`, it means the certificate presented doesn't include that name. Confirm whether you've added the apex domain to Pages settings and that your apex DNS points to GitHub's IPs or uses a provider ALIAS.
- If HTTPS is pending, wait up to an hour and retry the verification commands above.

4) Security & best practices

- Prefer redirecting the apex to `www` — it's simpler and avoids requiring multiple certificates and apex DNS complexity.
- Keep only a single hostname in the repository `CNAME` file (the primary canonical domain).
- After DNS changes, it may take time to propagate (TTL), and GitHub may take additional time to provision a certificate.

If you want I can also:
- Draft the exact DNS UI steps for your registrar (name the registrar), or
- Add a small script/CI check that verifies the domain resolves and TLS is valid after deploy.

Squarespace (domains managed in Squarespace)
-------------------------------------------

If your domain is registered or managed in Squarespace, follow these steps to point `www.tomlacy.net` to GitHub Pages and optionally handle the apex domain (`tomlacy.net`):

1. Open Squarespace and navigate to: Home Menu → Settings → Domains. Select the domain `tomlacy.net` from the list.

2. Click DNS settings (or Advanced DNS). You will see existing records that Squarespace may have created.

3. Add (or edit) a CNAME for the `www` host:

  - Type: CNAME
  - Host / Name: www
  - Data / Points to: tlacy.github.io
  - TTL: Automatic / default

  Note: Do not point `www` to a Squarespace hostname if you intend to serve the site from GitHub Pages.

4. Handle the apex (`tomlacy.net`) — choose one approach:

  a) Recommended — Redirect apex to www (simpler):

    - In Squarespace Domains settings look for a forwarding or domain mapping option and set the root/apex to redirect to `https://www.tomlacy.net` (301 permanent redirect). Squarespace provides a "Forwarding" option in the domain settings UI.
    - This keeps traffic consolidated to `www` and avoids needing apex A/ALIAS records.

  b) Serve apex directly via GitHub Pages (if you prefer):

    - Add the following A records (in Squarespace DNS) for the root/apex host:

      185.199.108.153
      185.199.109.153
      185.199.110.153
      185.199.111.153

    - Remove any conflicting A or CNAME records for the apex that point to Squarespace hosting.
    - In your GitHub repository Pages settings, add `tomlacy.net` as an additional custom domain (GitHub will attempt TLS provisioning once DNS is correct).

5. Save DNS changes. DNS propagation can take minutes to hours depending on TTL.

6. Verification (run locally):

```bash
# check www
curl -I -L -sS -o /dev/null -w "%{http_code} %{url_effective}\n" https://www.tomlacy.net

# check apex (if redirecting, this should 301 -> https://www.tomlacy.net or show HTTPS)
curl -I -L -sS -o /dev/null -w "%{http_code} %{url_effective}\n" https://tomlacy.net

# inspect the TLS certificate for www
echo | openssl s_client -servername www.tomlacy.net -connect www.tomlacy.net:443 2>/dev/null | sed -n '1,120p'
```

Troubleshooting notes specific to Squarespace:

- If Squarespace shows that the domain is "connected to a Squarespace site", you may need to disconnect it from Squarespace hosting before adding A records to point to GitHub. Look for a "Disconnect" or "Use other provider" option in domain settings.
- Squarespace may automatically add records; remove any records that conflict with the GitHub Pages setup (for example, CNAME for the root, or `www` pointing to Squarespace-specific hosts).
- If you're unsure, use the redirect approach (apex -> www) since Squarespace supports forwarding and is least intrusive.

