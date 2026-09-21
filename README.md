# HAJR Safety Climate Survey — V10 EMERGENCY / Deploy-Proof Build

Build marker: **V10 LIVE** (10.0.0-20260921)

This release is intentionally deploy-proof for the current Netlify/GitHub setup. The same current front-end exists both in `/public` and at repository root, while `netlify.toml` continues to publish `/public`. This removes ambiguity from the older duplicate root files that were still present in the repository.

## Critical fixes
- 4 roles only: Executive Leader / Director; Project Director / Manager; Engineer / Supervisor / Technician; Labour / Worker.
- Project name on the language-selection page is read from saved central configuration.
- Role labels/descriptions, divisions, questions, translations, logos and theme use the same central configuration.
- Manual/auto save now performs a server round-trip verification. The admin status says **Saved & verified** only after reading the saved data back from Netlify.
- Netlify Blob writes use `getStore()` directly in Function runtime. Production-context write gates were removed to avoid false 403s; admin config/reset remain protected by `ADMIN_KEY`.
- Interactive dashboard from V9 retained: Overall + questionnaire tabs, donut, role-factor heatmap, factor/role/division drill-downs, clickable question modal and comments.
- Cache-busting query strings and Netlify `_headers` disable stale HTML/JS/CSS caching for today's presentation.
- Admin header visibly shows **V10 LIVE** so you can confirm the new deploy is actually being served.

## Upload
Upload/replace **all files and folders** from this ZIP to GitHub. Do not upload the ZIP itself.

Expected repository items include both:
- `public/index.html`, `public/admin.html`, etc.
- root `index.html`, `admin.html`, etc.
- `netlify/functions/survey.mjs`
- `netlify.toml`
- `package.json`

Suggested commit: `V10 emergency - deploy proof, verified saving, final dashboard`

## Verify in 3 minutes
1. Netlify Deploys: latest deploy must point to the new V10 commit and show Published.
2. Open `/admin.html` in an Incognito window. Header must say **V10 LIVE**. If it does not, the new deploy is not live.
3. Data & Reset -> Test central storage.
4. Project & Branding -> change English project name -> Save now. You must get **Changes saved and verified on central storage.**
5. Open the public root URL in a new Incognito window. The language-selection page must show the new project name.
6. Change one role label and one division, Save now, reopen public survey and confirm both changes.
