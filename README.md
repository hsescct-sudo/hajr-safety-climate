# HAJR Safety Climate Survey — V9 FINAL / Today Build

This is the consolidated rebuild for the current client comments. It keeps the existing Netlify Blob store names so existing responses/configuration can be migrated instead of discarded.

## Final questionnaire structure — 4 roles
1. Executive Leader / Director
2. Project Director / Manager
3. Engineer / Supervisor / Technician
4. Labour / Worker

Historical responses from the old `Engineer / Supervisor` and `Technician` roles are grouped automatically under `Engineer / Supervisor / Technician` in analytics.

## Public survey fixes
- Language-selection screen reads the live saved project configuration (no hard-coded project name).
- Project name, survey name, description, logos, colours, languages, roles and divisions are loaded from central configuration.
- 10 languages remain available.
- Voice-to-text remains available for question comments and open questions.
- Strongly Disagree opens the justification box automatically.
- Every question supports an optional comment / justification.

## Admin saving fixes
- Central configuration save uses site-wide Netlify Blobs from the Function runtime.
- Removed manual site-ID binding that can cause a 403 write error without the correct runtime token.
- Auto-save status is shown in the header: Unsaved / Saving / Saved / Save failed.
- Manual `Save now` remains available.
- Project name, role labels, role descriptions, divisions, questions, translations, factors, logos and theme all use the same central save path.
- Data & Reset includes a central read/write/delete test.

## Interactive dashboard V9
- Overall + one dashboard per questionnaire.
- Favourable / Neutral / Unfavourable KPIs.
- Interactive response-mix donut.
- Interactive Role × Safety Climate Factor heatmap.
- Clickable Safety Climate Factor cards.
- Clickable Role bars to drill into that questionnaire.
- Clickable Division bars to filter by division.
- Question-by-question stacked results.
- Click any question to open:
  - detailed distribution
  - average normalized score
  - role breakdown
  - division breakdown
  - comments / justifications for that exact question
- Clickable most favourable / most unfavourable findings.
- Recent responses and CSV/JSON export.

## Files to upload to GitHub
Upload/replace all items from the V9 update ZIP while preserving folders:

```
public/
netlify/
netlify.toml
package.json
README.md
```

Netlify should continue to use:
- Publish directory: `public`
- Functions directory: `netlify/functions`

The existing `ADMIN_KEY` environment variable does not need to change.

Suggested commit message:

`V9 final - 4 roles, interactive dashboard and reliable central saving`

## After Netlify says Published
1. Open `/admin.html` and sign in.
2. Go to **Data & Reset** → **Test central storage**.
3. Confirm the result says the central read/write/delete test passed.
4. Go to **Project & Branding**, change the English project name, click **Save now**, then open the public root URL in a fresh/private tab and confirm the language-selection page shows the new name.
5. Go to **Languages, Roles & Divisions**, change one role label or division, save, refresh the public survey and confirm the change appears.
6. Submit one test response with a comment.
7. In Dashboard, click the role, a factor, a division, a heatmap cell and the question. Confirm the question modal shows the comment.

## QA completed before packaging
- JavaScript syntax check passed for all public/admin/function JS files.
- DOM-ID reference audit passed: all static IDs referenced by public/admin JavaScript exist in their HTML.
- Public local-state save/reload test passed for project name, divisions and role labels.
- V8 → V9 migration test passed, including the old Technician role mapping into the merged role.
- Public language rendering test passed for English and Arabic.
- Dashboard smoke test passed with sample response data, including KPI, donut and heatmap generation.
