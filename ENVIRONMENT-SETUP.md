# GitHub Environment Configuration for GoRASA

This document lists all required GitHub Environment variables and secrets for **CCKR** (staging) and **CCKR2** (production) environments.

## Required GitHub Secrets (Repository-level)

Navigate to: **Settings → Secrets and variables → Actions → Secrets**

| Secret | Description | Required For |
|--------|-------------|--------------|
| `VERCEL_TOKEN` | Vercel access token (create at vercel.com/account/tokens) | Both |
| `VERCEL_ORG_ID` | Vercel organization ID (from `vercel inspect` or project settings) | Both |
| `VERCEL_PROJECT_ID_CCKR` | Vercel project ID for CCKR deployment | CCKR |
| `VERCEL_PROJECT_ID_CCKR2` | Vercel project ID for CCKR2 deployment | CCKR2 |

## Required Environment Variables (Per-Environment)

Navigate to: **Settings → Environments → [cckr / cckr2] → Environment variables**

### CCKR (Staging Environment)
**Settings → Environments → cckr → Add variables**

| Variable | Value | Notes |
|----------|-------|-------|
| `DATABASE_URL` | `postgresql://user:pass@host:26257/defaultdb?sslmode=verify-full` | CockroachDB connection for CCKR |
| `DIRECT_URL` | `postgresql://user:pass@host:26257/defaultdb?sslmode=verify-full` | Direct connection for migrations |
| `BETTER_AUTH_SECRET` | `your-32-char-min-secret-key` | Generate: `openssl rand -base64 32` |
| `BETTER_AUTH_URL` | `https://cckr.vercel.app` | Must match Vercel deployment URL |
| `GOOGLE_CLIENT_ID` | `your-google-oauth-client-id` | From Google Cloud Console |
| `GOOGLE_CLIENT_SECRET` | `your-google-oauth-client-secret` | From Google Cloud Console |
| `TBO_USERNAME` | `your-tbo-username` | TBO API credentials |
| `TBO_PASSWORD` | `your-tbo-password` | TBO API credentials |
| `TBO_HOTEL_USERNAME` | `your-tbo-hotel-username` | TBO Hotel static data credentials (Basic Auth) |
| `TBO_HOTEL_PASSWORD` | `your-tbo-hotel-password` | TBO Hotel static data credentials (Basic Auth) |
| `TBO_ENDPOINT` | `https://affiliate.tektravels.com/HotelAPI` | TBO hotel search/booking base URL |
| `TBO_BOOKING_ENDPOINT` | `https://HotelBE.tektravels.com/hotelservice.svc/rest` | TBO hotel booking/confirm URL |
| `TBO_STATIC_ENDPOINT` | `http://api.tbotechnology.in/TBOHolidays_HotelAPI` | TBO hotel static data URL (country,city,codes,details) |
| `NODE_ENV` | `production` | |

### CCKR2 (Production Environment)
**Settings → Environments → cckr2 → Add variables**

| Variable | Value | Notes |
|----------|-------|-------|
| `DATABASE_URL` | `postgresql://user:pass@host:26257/defaultdb?sslmode=verify-full` | CockroachDB connection for CCKR2 (separate cluster/db) |
| `DIRECT_URL` | `postgresql://user:pass@host:26257/defaultdb?sslmode=verify-full` | Direct connection for migrations |
| `BETTER_AUTH_SECRET` | `your-32-char-min-secret-key` | Different from CCKR! |
| `BETTER_AUTH_URL` | `https://project-yidb6.vercel.app` | Must match Vercel deployment URL |
| `GOOGLE_CLIENT_ID` | `your-google-oauth-client-id` | Separate OAuth app for production |
| `GOOGLE_CLIENT_SECRET` | `your-google-oauth-client-secret` | |
| `TBO_USERNAME` | `your-tbo-username` | |
| `TBO_PASSWORD` | `your-tbo-password` | |
| `TBO_HOTEL_USERNAME` | `your-tbo-hotel-username` | Static data Basic Auth |
| `TBO_HOTEL_PASSWORD` | `your-tbo-hotel-password` | Static data Basic Auth |
| `TBO_ENDPOINT` | `https://affiliate.tektravels.com/HotelAPI` | Hotel search/booking URL |
| `TBO_BOOKING_ENDPOINT` | `https://HotelBE.tektravels.com/hotelservice.svc/rest` | Hotel booking/confirm URL |
| `TBO_STATIC_ENDPOINT` | `http://api.tbotechnology.in/TBOHolidays_HotelAPI` | Hotel static data URL |
| `NODE_ENV` | `production` | |

## Protection Rules (Per-Environment)

Navigate to: **Settings → Environments → [cckr / cckr2] → Protection rules**

### CCKR (Staging)
- ✅ **Required reviewers**: 0 (auto-deploy on push to main/develop)
- ✅ **Wait timer**: 0 minutes
- ✅ **Deployment branches**: All branches (or specify: `main`, `develop`)

### CCKR2 (Production)
- ✅ **Required reviewers**: 1+ (recommended: @nikjp2021 or team leads)
- ✅ **Wait timer**: 5 minutes (allows cancellation window)
- ✅ **Deployment branches**: Only `main` branch
- ✅ **Prevent self-review**: Enabled

## Vercel Project Setup

### Get Project IDs
```bash
# Login to Vercel
vercel login

# Link project (run in project root)
vercel link

# Get project IDs
vercel inspect cckr.vercel.app --token=$VERCEL_TOKEN
vercel inspect project-yidb6.vercel.app --token=$VERCEL_TOKEN
```

### Vercel Environment Variables
In Vercel Dashboard → Project → Settings → Environment Variables, add the same variables listed above for each environment (Preview = CCKR, Production = CCKR2).

## Quick Setup Checklist

### Repository Secrets
- [ ] `VERCEL_TOKEN`
- [ ] `VERCEL_ORG_ID`
- [ ] `VERCEL_PROJECT_ID_CCKR`
- [ ] `VERCEL_PROJECT_ID_CCKR2`

### CCKR Environment
- [ ] All 12 environment variables added
- [ ] Protection rules: No required reviewers, 0 wait timer
- [ ] Deployment branches: main, develop

### CCKR2 Environment
- [ ] All 12 environment variables added (different values!)
- [ ] Protection rules: 1+ required reviewers, 5 min wait timer
- [ ] Deployment branches: main only
- [ ] Prevent self-review: Enabled

### Vercel Projects
- [ ] CCKR project linked and configured
- [ ] CCKR2 project linked and configured
- [ ] Environment variables synced in Vercel dashboard
- [ ] Custom domains: cckr.vercel.app, project-yidb6.vercel.app

## Testing Deployments

```bash
# Trigger CCKR deployment (staging)
gh workflow run deploy-cckr.yml -f environment=cckr

# Trigger CCKR2 deployment (production) - requires typing "deploy"
gh workflow run deploy-cckr2.yml -f confirm_production=deploy
```

---

**Note:** Never commit actual secret values to this file. Use GitHub's encrypted secrets/environments only.