# Deployment Guide

## Deploy to Vercel

### Option 1: GitHub Integration (Recommended)

1. Go to [vercel.com](https://vercel.com)
2. Sign in with your GitHub account
3. Click "New Project"
4. Import the repository: `anishkganesh/cis581`
5. Vercel will auto-detect the Vite framework
6. **Add Environment Variables**:
   - Go to **Settings** → **Environment Variables**
   - Add `VITE_OPENAI_API_KEY` with your OpenAI API key
   - Select: Production, Preview, Development
7. Click "Deploy"

### Option 2: Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel

# Deploy to production
vercel --prod
```

### Option 3: Manual Git Push

The repository is already configured at:
https://github.com/anishkganesh/cis581

Simply connect it to Vercel via the dashboard.

---

## Environment Variables

**Required for Production:**

| Variable | Value | Description |
|----------|-------|-------------|
| `VITE_OPENAI_API_KEY` | `sk-proj-...` | Your OpenAI API key |

⚠️ **Important**: Never commit `.env.local` to git. It's already in `.gitignore`.

---

## Post-Deployment Steps

1. **Test the deployed app** at your Vercel URL
2. **Verify environment variables** are working (test OCR and image generation)
3. **Check production build** logs for any errors
4. **Monitor API costs** in your OpenAI dashboard

---

## Vercel Configuration

The project includes `vercel.json` with:
- Framework detection: Vite
- Build command: `npm run build`
- Output directory: `dist`
- SPA routing rewrites

---

## Troubleshooting

### Build Fails
- Check that all dependencies are in `package.json`
- Verify Node.js version compatibility (18.x or higher)
- Review build logs in Vercel dashboard

### Environment Variables Not Working
- Ensure variables use `VITE_` prefix (not `REACT_APP_`)
- Redeploy after adding variables
- Check variables are set for correct environments

### Images Not Generating
- Verify OpenAI API key is valid
- Check API credits in OpenAI dashboard
- Review function logs in Vercel dashboard

---

## Custom Domain (Optional)

1. Go to Vercel project settings
2. Navigate to **Domains**
3. Add your custom domain
4. Follow DNS configuration instructions

---

## Repository

**GitHub**: https://github.com/anishkganesh/cis581
**Branch**: main

All code is committed and pushed. Ready for Vercel deployment!
