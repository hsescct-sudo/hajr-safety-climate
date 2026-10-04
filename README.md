# Safety Climate V10.15 — Prize Draw Data Reset

New admin control: **Clear Prize Draw Data** in the Prize Draw tab. It deletes raffle participants, raffle device locks and raffle draw history only. It does **not** delete survey responses, dashboard data, campaigns, questions or project settings. Two confirmations are required.

# Safety Climate Survey Platform — V10.15 FINAL CLEAN

V10.15 fixes the latest client comments while preserving the V10.13 dashboard/report design, campaigns, responses, actions, raffle data and single-device controls.

## V10.15 fixes completed

- **4 Roles:** the public KPI now says **Roles** (not Questionnaires) and the wording is forced across all 11 languages during config migration.
- **Listen to Question:** voice loading now waits for browser/device voices and tries multiple language locale variants (including Filipino/Tagalog, Bangla, Urdu, Arabic, Nepali, Telugu, Tamil, Malayalam and Chinese).
- **Excel fixed:** reports are generated as a **real `.xlsx` workbook** by the bundled zero-dependency XLSX writer. This removes the Microsoft Excel “file format and extension do not match” warning caused by the previous HTML-as-`.xls` method.
- The `.xlsx` workbook contains Executive Dashboard, Questions, Factor Detail (detailed report), Open Questions, Actions and Comments sheets.
- If native XLSX generation is unavailable, the browser produces an Excel-compatible XML fallback instead of a corrupt/mismatched `.xls`.
- Existing Word and PowerPoint reports are unchanged.

## Report Center


Choose:
1. Campaign
2. Division
3. Report Type — Management Executive / Detailed Safety Climate / Client Summary
4. Format — **Word / Excel / PowerPoint**

## Deployment

Upload the **contents** of this folder to the existing GitHub repository so `public`, `netlify`, `netlify.toml` and `package.json` remain at repository root. Keep the existing Netlify `ADMIN_KEY`.

After Netlify shows **Published**:
1. Open `/admin.html` and confirm **V10.15 FINAL CLEAN**.
2. Confirm the **8 Safety Climate Factors** chart shows green / amber / red stacked percentages.
3. Data & Reset → confirm **Enforce one survey response per browser/device per campaign** is checked.
4. Run **Test central storage**.
5. Generate a Word report: Executive Summary should be first, then the full dashboard with the donut and tri-colour factor chart.
6. Generate a PowerPoint: Executive Summary should be slide 1, Dashboard slide 2, tri-colour factor summary slide 3.
7. Public survey → test one translated language and the speaker icon, then verify a second response from the same device/campaign is blocked.

### Shared-device note
Strict single-device mode intentionally blocks a second survey response from the same browser/device during the same campaign. If a project uses shared kiosks/tablets for many workers, the Admin can disable this control.
