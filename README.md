# Safety Climate Survey Platform — V10.9 FINAL CLEAN

This release implements the final client comments on top of V10.8 while preserving the existing cloud response/configuration stores.

## Client final comments completed

- No project-specific legacy project wording is hard-coded in the visible platform or generated reports.
- Default scope is **Overall Business Units – Corporation** and can still be edited from Project & Branding.
- Open Question 2 and 3 are generic and translated across all 11 enabled languages.
- Current Admin open-question wording is used in reports even for historical responses; old question snapshots are not used as report headings.
- All three open questions are shown as grouped appendices plus one consolidated response register.
- Filipino / Tagalog is forced enabled during migration.
- Report Center retains Campaign + Division selection and 3 report types in Word / Excel.
- Period filter: All Responses / 7 / 14 / 21 / 30 days.
- QR poster includes the survey sequence plus a demo-video route.
- Short survey demo video is included at `/demo.html`.
- Favourable / Neutral / Unfavourable percentages remain visible in stacked sentiment charts.
- Existing Campaigns, Comparison Dashboard, Actions, Evidence, Reports and historical responses are preserved.

## Open questions

1. Please give three suggestions that you feel would make the biggest improvement to health and safety.
2. What are the three biggest barriers preventing your project/company/division/business from making improvements in health and safety?
3. What positive things do you see about health and safety in your project/company/division/business?

## Deployment

Upload the contents of this folder to the existing GitHub repository so these stay at repository root:

- `public/`
- `netlify/`
- `netlify.toml`
- `package.json`

Keep the existing Netlify `ADMIN_KEY`. Existing Netlify Blob store names are intentionally retained internally for backward compatibility with the live data.

After deployment:
1. Wait for Netlify **Published**.
2. Open `/admin.html` and confirm **V10.9 FINAL CLEAN**.
3. Run **Data & Reset → Test central storage**.
4. Open **Questionnaire Builder** and confirm Open Q2/Q3 are generic in all languages.
5. Generate a report and confirm the same current wording appears in the report.
6. Confirm no legacy project-specific wording or removed project logo appears in public/admin/reports.
7. Open **QR Poster** and **Survey Demo Video**.
