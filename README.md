# HAJR Safety Climate Survey — V10.5 FINAL CLEAN

Production-ready clean release based on the approved V10.4 platform, with clean management threshold bars and a fully interactive campaign comparison dashboard.


## Deployment
Upload the contents of this folder to the GitHub repository root. Keep `public/`, `netlify/`, `netlify.toml`, and `package.json` at the root. Netlify publish directory remains `public`.

Recommended commit message:
`V10.5 final - clean threshold bars and interactive campaign comparison`

After Netlify shows **Published**, test in this order:
1. Admin → Data & Reset → Test central storage.
2. Admin → Campaigns → confirm the baseline campaign is Active/Open.
3. Create a Draft campaign, then Activate it and confirm the previous campaign becomes Closed.
4. Open the public survey and submit one test response; confirm it is linked to the new campaign.
5. Dashboard → Campaign Comparison → compare the baseline and new campaign.
6. Confirm Role / Factor / Division bars use Green / Amber / Red thresholds.
7. Test an Action response + evidence attachment + closure.
8. Generate Word and Excel reports.


## New in V10.5
- Clean HSE threshold colouring: only the score bar is Green / Amber / Red; cards and rows stay white.
- Full interactive Campaign Comparison dashboard with A/B sentiment, factor, role, division and question comparison.
- Comparison cross-filtering: click Factor / Role / Division to recalculate the complete comparison.
- Comparison view modes: All, Improved, Declined, Major changes ≥ 10 points.
- Question drill-through with campaign-specific comments and evidence.
- Low sample-size warning instead of misleading zero values; missing comparison samples display as N/A.
- Evidence / action comparison and management signals are included.

Recommended commit:
`V10.5 final - clean threshold bars and interactive campaign comparison`
