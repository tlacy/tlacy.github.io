# Deployment Workflow for tomlacy.net

## Branch Strategy

This repository uses a **two-branch workflow**:

- **`master`** - Development branch (your working branch)
- **`main`** - Production branch (auto-deploys to GitHub Pages)

## Why Two Branches?

The GitHub Actions workflow (`.github/workflows/pages.yml`) is configured to deploy only from the `main` branch. This provides a safety gate between development and production.

## Production Deployment Workflow

### Step 1: Work on `master` Branch

```bash
# Ensure you're on master
git checkout master

# Make your changes, then stage and commit
git add <files>
git commit -m "feat: your changes"

# Push to master (remote backup, but won't deploy)
git push origin master
```

### Step 2: Merge to `main` to Deploy

```bash
# Switch to main branch
git checkout main

# Pull latest changes
git pull origin main

# Merge your master changes
git merge master -m "deploy: merge changes from master"

# Push to main - this triggers GitHub Pages deployment
git push origin main

# Switch back to master for continued work
git checkout master
```

### Step 3: Wait for Deployment

- GitHub Actions workflow runs automatically (1-2 minutes)
- Check deployment status: https://github.com/tlacy/tlacy.github.io/actions
- Site updates appear at: https://www.tomlacy.net

## Quick Deploy Commands (Copy-Paste)

```bash
# After committing to master, run these to deploy:
git checkout main && \
git pull origin main && \
git merge master -m "deploy: latest changes" && \
git push origin main && \
git checkout master
```

## Alternative: Update Workflow to Deploy from Master

If you prefer to deploy directly from `master`, edit `.github/workflows/pages.yml`:

```yaml
on:
  push:
    branches: [ master ]  # Change from 'main' to 'master'
```

Then commit and push to `master`:

```bash
git add .github/workflows/pages.yml
git commit -m "chore: deploy from master branch"
git push origin master
```

## Current Deployment Targets

- **Primary Domain**: https://www.tomlacy.net
- **GitHub Pages URL**: https://tlacy.github.io (redirects to primary)
- **Deployment Branch**: `main` (via `.github/workflows/pages.yml`)
- **Working Branch**: `master`

## Troubleshooting

### Changes pushed but not live?

1. Check which branch you pushed to: `git branch --show-current`
2. If on `master`, merge to `main` (see Step 2 above)
3. Check GitHub Actions: https://github.com/tlacy/tlacy.github.io/actions
4. Look for failed workflows (red X) or in-progress (yellow circle)

### Want to skip the merge step?

Switch your default working branch to `main`:

```bash
# Make main your primary branch
git checkout main
git pull origin main

# Delete local master (optional, after merging everything)
git branch -d master
```

Then work directly on `main` - every push deploys automatically.

## Recommended Workflow

**For most changes**: Use the two-branch workflow (master → main) to review before deploying.

**For quick fixes**: Work directly on `main` and push (immediate deployment).

**For major features**: Create feature branches, merge to `master` for testing, then merge to `main` for production.

## Files That Affect Deployment

- `.github/workflows/pages.yml` - Deployment configuration
- `CNAME` - Custom domain configuration (www.tomlacy.net)
- `.gitignore` - Files excluded from deployment (e.g., `manage.html`)

---

Last Updated: November 11, 2025
