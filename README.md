# Safety Climate Survey Platform — V10.16.1 DELETE ACTION HOTFIX

This hotfix adds an Admin-only **Delete Action** control inside **Action Plan & Comments → Manage**.

- Deletes only the selected action record content and its evidence attachments.
- Does **not** delete survey responses, comments, campaigns, Prize Draw data or dashboard data.
- Writes a minimal suppression tombstone for the Action ID so the same historic/test trigger does not regenerate.
- KPI and Action Plan counts ignore suppressed/deleted actions.
- Existing V10.16 features remain unchanged.

Deploy the full clean package or use the update-only package containing only the changed files.
# Safety Climate V10.16 — Prize Draw Data Reset

New admin control: **Clear Prize Draw Data** in the Prize Draw tab. It deletes raffle participants, raffle device locks and raffle draw history only. It does **not** delete survey responses, dashboard data, campaigns, questions or project settings. Two confirmations are required.

# Safety Climate Survey Platform — V10.16 FINAL CLEAN

V10.16 fixes the latest client comments while preserving the V10.13 dashboard/report design, campaigns, responses, actions, raffle data and single-device controls.

## V10.16 fixes completed

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
1. Open `/admin.html` and confirm **V10.16 FINAL CLEAN**.
2. Confirm the **8 Safety Climate Factors** chart shows green / amber / red stacked percentages.
3. Data & Reset → confirm **Enforce one survey response per browser/device per campaign** is checked.
4. Run **Test central storage**.
5. Generate a Word report: Executive Summary should be first, then the full dashboard with the donut and tri-colour factor chart.
6. Generate a PowerPoint: Executive Summary should be slide 1, Dashboard slide 2, tri-colour factor summary slide 3.
7. Public survey → test one translated language and the speaker icon, then verify a second response from the same device/campaign is blocked.

### Shared-device note
Strict single-device mode intentionally blocks a second survey response from the same browser/device during the same campaign. If a project uses shared kiosks/tablets for many workers, the Admin can disable this control.


## V10.16 Admin Security
- Production Admin password can be changed from **Admin > Data & Reset > Admin Security**.
- The new password becomes active immediately; the previous password no longer works.
- The custom password is stored only as a salted **PBKDF2-SHA256** one-way hash in a private server-side Netlify Blob store.
- Netlify `ADMIN_KEY` is the initial bootstrap credential. After an in-app password change, the original environment value is not accepted as a normal login.
- Emergency recovery: if the password is forgotten, IT can deliberately rotate the Netlify `ADMIN_KEY`; the newly rotated environment value is accepted as a recovery credential, after which a new in-app password can be set.
