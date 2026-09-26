# HAJR Safety Climate Survey — V10.8 FINAL CLEAN

Project: **70330 – HAJR Expansion Project**

This release is based directly on **V10.7 FINAL CLEAN** and closes the latest client comments without removing the existing dashboard, campaign, action-management or reporting features.

## Client comments closed in V10.8

1. **Division-based reports** — Report Center now has Campaign + Division scope. Choose **All Divisions** or any individual division.
2. **Percentages on sentiment colours** — Favourable / Neutral / Unfavourable stacked bars now display the percentages inside the colour segments where readable, with tooltips for every segment.
3. **Philippines language** — **Filipino / Tagalog** is forced into older cloud configurations during migration and remains language #11. Voice-to-text locale: `fil-PH`.
4. **Open-question consolidation** — all three report families contain a dedicated Open Question Summary grouped by question, with response count, role, division, date and response text.
5. **QR poster** — Admin dashboard includes a **QR Poster** button. The deployment also contains a printable poster page plus A3 PDF/PNG assets.
6. **Period filter** — Dashboard and campaign comparison support **All Responses / 7 / 14 / 21 / 30 days**.

## Report Center

Scope selectors:
- Campaign
- Division (All Divisions or one division)

Report families:
1. **Management Executive Report** — Word / Excel
2. **Detailed Safety Climate Report** — Word / Excel
3. **Client Summary Report** — Word / Excel

All report families use the selected campaign and division scope. File names include the selected division.

## Existing features preserved

- Campaign management: Create / Activate / Close / Archive
- Fully interactive Campaign Comparison dashboard
- Four final questionnaires / roles
- Eight safety climate factors
- Eleven languages including Filipino / Tagalog
- RTL support where required
- Voice-to-text comments / open questions
- Threshold colours: Green ≥75%, Amber 60–74.9%, Red <60%
- Question drill-through and comments
- Action management, response, owner, target date, evidence attachments and formal close-out
- Central Netlify Blobs storage
- Verified configuration save / round-trip checking

## Deployment

Upload the contents of this package to the existing HAJR GitHub repository so that these remain at repo root:

- `public/`
- `netlify/`
- `netlify.toml`
- `package.json`

Keep the existing Netlify `ADMIN_KEY`. Wait for **Published**, then hard refresh the Admin page (`Ctrl + F5`).

Recommended commit message:

`V10.8 final - client comments, division reports, Filipino, open questions, QR poster and period filters`

## Post-deploy check

- Admin header shows **V10.8 FINAL CLEAN**
- Public language page shows **Filipino / Tagalog** and 11 languages
- Dashboard Period shows 7 / 14 / 21 / 30 days
- Sentiment Mix bars show percentages by colour
- Report Center shows Campaign + Division + 3 Report Types + Word/Excel
- Generate one All Divisions report and one single-division report
- Open Question Summary appears in reports
- QR Poster button opens and the QR points to `https://safety-climate-survey.netlify.app/`
- Data & Reset → Test central storage passes
- Save a harmless configuration change and confirm **Saved & verified**
