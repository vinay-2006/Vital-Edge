# Deployment Guide (Render + Vercel)

This repo is pre-configured for:
- Backend on Render (using `render.yaml`)
- Frontend on Vercel (using `frontend/vercel.json`)

## 1) Deploy Backend on Render (Blueprint)

1. Go to Render dashboard.
2. Choose **New +** → **Blueprint**.
3. Select this GitHub repository.
4. Render detects `render.yaml` automatically.
5. Fill the required env values:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `CORS_ORIGIN` (set this to your Vercel frontend URL, e.g. `https://your-app.vercel.app`)
6. Click **Apply** to deploy.

Backend service settings come from `render.yaml`:
- rootDir: `backend`
- build: `npm install --include=dev && npm run build`
- start: `npm run start`
- health check: `/health`

## 2) Verify Backend

Open:
- `https://<your-render-service>.onrender.com/health`

You should see a healthy JSON response.

## 3) Deploy Frontend on Vercel

1. Go to Vercel dashboard.
2. Click **Add New Project**.
3. Import this GitHub repository.
4. Set **Root Directory** to `frontend`.
5. Framework: Vite (auto-detect).
6. Add Environment Variables:
   - `VITE_API_URL=https://<your-render-service>.onrender.com`
   - `VITE_SUPABASE_URL=<same as backend SUPABASE_URL>`
   - `VITE_SUPABASE_ANON_KEY=<same anon key>`
7. Deploy.

## 4) Final CORS Check

If your final Vercel URL differs, update Render env var:
- `CORS_ORIGIN=https://<your-final-vercel-domain>`

Then redeploy backend.

## 5) Manual Smoke Test

- Open frontend URL.
- Create triage entry.
- Confirm result page renders priority, confidence, explainability, risk.
- Open dashboard and confirm metrics/table/chart.
- Test CSV export.

## Notes

- Frontend keys are public by design (`VITE_*`). Keep only anon key there.
- Do not put Supabase service role key in frontend.
- Render free tier may cold-start after inactivity.
