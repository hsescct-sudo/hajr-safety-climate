# HAJR Safety Climate Survey — V10.6 FINAL CLEAN

Production-ready release based on V10.5, adding a dedicated **Report Center** while preserving the approved dashboard, campaign management, comparison dashboard and action close-out workflow.

## New in V10.6
- One **Report Center** button replaces the separate Word / Excel buttons.
- Choose the campaign to report.
- Choose one of two report families:
  1. **Management Executive Report** — the existing report is retained.
  2. **Detailed Safety Climate Report** — new detailed final survey report.
- Choose **Word** or **Excel** output for either report.
- Detailed report includes:
  - Project logos and campaign details
  - Executive summary
  - Overall favourable / neutral / unfavourable results
  - 8 Safety Climate Factor overview
  - Dedicated section for every factor
  - Question-by-question sentiment results
  - Most favourable and most unfavourable findings
  - Favourable by Role and Division
  - Selected comments / justifications
  - Recommended management response
  - Next steps and priority improvement areas
  - Management Action Plan & Close-out Register
- Detailed Excel output includes visual performance bars, factor sections, question sentiment tables, role/division charts, comments and the action register.
- Reports always use **All Respondents** for the selected campaign so dashboard filters cannot accidentally create a partial final report.
- No external industry benchmark is claimed; internal HAJR performance thresholds are used for management interpretation.

## Existing V10.5 functionality retained
- Clean Green / Amber / Red performance bars
- Power BI-style interactive dashboard
- Campaign Management
- Fully interactive Campaign Comparison
- Question drill-through and comments
- Central action management and evidence attachments
- 10-language public survey and voice-to-text

## Deployment
Upload the contents of this folder to the GitHub repository root. Keep `public/`, `netlify/`, `netlify.toml`, and `package.json` at the root. Netlify publish directory remains `public`.

Recommended commit message:
`V10.6 final - report center and detailed safety climate report`

After Netlify shows **Published**, test:
1. Admin → confirm **V10.6 FINAL CLEAN**.
2. Dashboard → **Report Center**.
3. Select a campaign.
4. Generate **Management Executive Report → Word**.
5. Generate **Management Executive Report → Excel**.
6. Generate **Detailed Safety Climate Report → Word**.
7. Generate **Detailed Safety Climate Report → Excel**.
8. Confirm the Action Plan / close-out status appears in both report families.
