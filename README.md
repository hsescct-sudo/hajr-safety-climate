# Safety Climate Survey Platform — V10.13 FINAL CLEAN

V10.13 applies the latest reporting and dashboard comments on top of V10.12 while preserving campaigns, responses, actions, raffle data, multilingual content and single-device controls.

## V10.13 changes completed

- **Online 8 Safety Climate Factors is now tri-colour:** every factor is a 100% stacked bar showing **Favourable / Neutral / Unfavourable** with the percentage inside each colour segment.
- **Report factor summary now matches the dashboard:** Word, Excel and PowerPoint show the same three-colour response distribution for all 8 factors.
- **Executive Summary is first:** Word reports open with a concise Executive Summary brief, followed immediately by the full Executive Dashboard.
- **Full report dashboard:** KPIs, Overall Safety Climate donut, Favourable by Role, tri-colour factor summary and Division Performance are shown together.
- **Donut restored in reports:** the Overall Safety Climate donut is embedded in the Word dashboard and the PowerPoint Executive Dashboard.
- **PowerPoint sequence corrected:** Slide 1 = Executive Summary Brief, Slide 2 = Executive Dashboard, Slide 3 = Summary of Overall Responses by Factor.
- **PowerPoint reliability hardened:** bundled PptxGenJS is reloaded on demand if needed, with a load timeout plus Blob-download fallback if direct `writeFile()` is blocked.
- Existing **listen-to-question**, 11-language journey, strict single-device survey control, raffle control, open-question consolidation, campaign/division filters and action close-out remain enabled.

## Report Center

Choose:
1. Campaign
2. Division
3. Report Type — Management Executive / Detailed Safety Climate / Client Summary
4. Format — **Word / Excel / PowerPoint**

## Deployment

Upload the **contents** of this folder to the existing GitHub repository so `public`, `netlify`, `netlify.toml` and `package.json` remain at repository root. Keep the existing Netlify `ADMIN_KEY`.

After Netlify shows **Published**:
1. Open `/admin.html` and confirm **V10.13 FINAL CLEAN**.
2. Confirm the **8 Safety Climate Factors** chart shows green / amber / red stacked percentages.
3. Data & Reset → confirm **Enforce one survey response per browser/device per campaign** is checked.
4. Run **Test central storage**.
5. Generate a Word report: Executive Summary should be first, then the full dashboard with the donut and tri-colour factor chart.
6. Generate a PowerPoint: Executive Summary should be slide 1, Dashboard slide 2, tri-colour factor summary slide 3.
7. Public survey → test one translated language and the speaker icon, then verify a second response from the same device/campaign is blocked.

### Shared-device note
Strict single-device mode intentionally blocks a second survey response from the same browser/device during the same campaign. If a project uses shared kiosks/tablets for many workers, the Admin can disable this control.
