# Atharv Kashiv — Game Developer Portfolio

Open-world, sunset-neon portfolio. Plain HTML/CSS/JS with GSAP + ScrollTrigger + Lenis from CDNs, and one Vercel function.

## Make it yours
Edit `js/config.js`: socials, stats, weapon-wheel skills, story chapters, `githubUser`.

## Live projects from Vercel
`api/projects.js` lists your Vercel projects and turns each one into a mission card (with the GitHub description, language and stars when the project is linked to a repo).

1. Create a token at https://vercel.com/account/tokens (read access is enough).
2. In the portfolio's Vercel project, go to **Settings → Environment Variables** and add:
   - `VERCEL_TOKEN`: the token (required)
   - `VERCEL_TEAM_ID`: only if your projects live in a team
   - `HIDE_PROJECTS`: comma list of project names to skip, e.g. `portfolio`
   - `GITHUB_TOKEN`: optional, raises the GitHub rate limit
3. Redeploy. Results are cached at the edge for 1 hour.

With no token set, the site falls back to your public GitHub repos whose homepage is a `*.vercel.app` URL (needs `githubUser` in config). If that is empty too, it shows locked missions.

## Run locally
```bash
npm run dev            # http://localhost:5173 (add VERCEL_TOKEN=... in front to test the API)
npm test               # API tests
```

## Deploy
```bash
npx vercel --prod
```

Easter eggs: type `HIRE` or `NEON` anywhere on the page.
