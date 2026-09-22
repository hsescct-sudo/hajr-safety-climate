# HAJR Safety Climate Survey — V10.2 FINAL CLEAN

Project: **70330 – HAJR Expansion Project**

This is the clean deployment package based on the latest V10.1 work, consolidated into one production structure. It keeps the existing central Netlify Blob stores so current project configuration and submitted responses can continue to be used.

## Final production structure

- `public/` — the only published website folder
- `netlify/functions/survey.mjs` — API for configuration and responses
- `netlify.toml` — publishes `public/`
- `package.json` — Netlify Blobs dependency

There are no duplicate website files in the repository root.

## Final roles

1. Executive Leader / Director
2. Project Director / Manager
3. Engineer / Supervisor / Technician
4. Labour / Worker

## Dashboard

Power BI-style dashboard with:

- Campaign / Role / Division / Factor / Language / Period filters
- KPI tiles
- Favourable / Neutral / Unfavourable donut
- Role and Division bar charts
- 8-factor analysis
- Role × Factor heatmap
- Safety Climate radar
- Campaign / factor trend chart
- Priority bubble map
- Role sentiment stacked bars
- Question drill-through
- Comments / justification analysis
- Evidence-based Action Plan

There is **no contractor/company field or contractor dashboard analysis**.

## Final report outputs

From Admin → Dashboard:

- **Word Report** — management report with executive summary, factors, roles, divisions, question analysis, comments and action plan.
- **Excel Workbook** — multiple worksheets: Executive Summary, Factor Analysis, Role Comparison, Division Analysis, Question Analysis, Comments, Action Plan and Raw Responses.

The action logic flags low favourable / high unfavourable findings and creates editable management recommendations. Management/HSE review is still required before formal issue.

## Saving fix

V10.2 aligns browser and server configuration schema/version (`hajr-safety-climate-v10`). The server writes the configuration, reads it back using strong consistency, and the Admin verifies the returned stored object.

## Deploy today

1. Create/use one GitHub repo for this final version.
2. Upload the **contents of this folder** so `public`, `netlify`, `netlify.toml` and `package.json` are at the repository root.
3. Keep the existing Netlify environment variable `ADMIN_KEY`.
4. Netlify should detect `netlify.toml` and publish `public/`.
5. Wait for **Published**.
6. Open `/admin.html` and confirm the header says **V10.2 FINAL CLEAN**.
7. Run **Data & Reset → Test central storage**.
8. Change the Project Name, press **Save now**, and confirm **Saved & verified**.
9. Open the public survey in an Incognito window and verify the changed project name appears on the language selection page.
10. Submit one test response with a comment, refresh Dashboard, drill into the question, then test Word Report and Excel Workbook.

## Important

Do not upload older V8/V9/V10 root copies beside this project. This package is intentionally clean and has only one published frontend source: `public/`.
