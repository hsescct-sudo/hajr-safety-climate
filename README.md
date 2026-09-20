# HAJR Safety Climate Survey V8 — Interactive Dashboard + Reliable Saving

This is a clean production-oriented rebuild of the current HAJR survey platform.

## V8 changes requested by the client

### Interactive dashboard
- Overall project dashboard + separate dashboard for each of the five questionnaires.
- HSE-style Unfavourable / Neutral / Favourable stacked bars.
- Safety climate factor cards are clickable filters.
- Question rows are clickable.
- Clicking a question opens a detailed panel showing:
  - response count
  - favourable / neutral / unfavourable distribution
  - average normalised score
  - raw 1–5 response distribution
  - favourable response breakdown by Role
  - favourable response breakdown by Division
  - every comment / justification submitted against that question
- Dashboard filters for Division, Safety Climate Factor and question search.
- Most favourable / most unfavourable questions are clickable.
- Latest comments are clickable and open the related question.

### Saving / configuration reliability
- Project & Branding, Questionnaire Builder, Languages, Roles and Divisions now auto-save.
- A visible Save Status indicator shows Saved / Saving / Save failed.
- Manual **Save now** remains available.
- Browser warning appears if a page is closed while unsaved changes remain.
- Central storage test button added under Data & Reset.

### Voice input
- Voice-to-text remains available for comments/justifications and open questions.
- Strongly Disagree continues to automatically open the justification box.

### Netlify storage / reset fix
The site structure now follows Netlify's recommended layout:
- static site: `public/`
- functions: `netlify/functions/`
- `netlify.toml` publishes only `public/`

The Blob function now:
- creates site-wide stores inside the actual function request
- explicitly binds to the runtime Site ID
- uses a single fixed region (`us-east-2`) for all reads/writes/deletes
- performs reset by deleting stored response keys one-by-one
- includes an admin storage read/write/delete test
- blocks destructive writes outside the production deploy

The existing Blob store names are unchanged:
- `hajr-safety-config`
- `hajr-safety-responses`

This is intended to retain the current cloud configuration and survey responses.

## Deploy to the current GitHub / Netlify project

Upload the **contents** of this package to the repository root, preserving folders:

```
public/
  index.html
  admin.html
  admin.js
  public.js
  cloud.js
  core.js
  defaults.js
  styles.css
  assets/
netlify/
  functions/
    survey.mjs
netlify.toml
package.json
README.md
```

The older root-level `index.html`, `admin.html`, JS and CSS files can remain in GitHub; after this update Netlify publishes the `public/` folder, so the old root copies are ignored. You may delete them later for tidiness.

Suggested commit message:

`V8 interactive dashboard, autosave and Netlify storage fix`

Netlify should deploy automatically after the GitHub commit. Keep the existing `ADMIN_KEY` environment variable.

## After deployment — verification

1. Open the public survey and submit one test response with a question comment.
2. Open `/admin.html` and log in.
3. Go to **Data & Reset → Test central storage**. It should report that read/write/delete passed.
4. Go to **Dashboard** and click the question you commented on. The comment should appear in the detail panel.
5. Go to **Languages, Roles & Divisions**, change a harmless test value, wait until the top status says **Saved**, refresh the page, and confirm the change remains.
6. Restore the test value and wait for **Saved** again.

