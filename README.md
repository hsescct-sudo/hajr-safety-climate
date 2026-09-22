# HAJR Safety Climate Survey — V10.4 FINAL CLEAN

Production-ready clean release based on V10.3 with the client-requested campaign controls and management colour logic.

## New in V10.4
- Performance bars now use management thresholds: **Green ≥ 75%**, **Amber 60–74.9%**, **Red < 60%**.
- New **Campaigns** admin tab: create Draft campaigns, edit campaign details, activate, close and archive without deleting historical responses.
- Only the **active Open campaign** accepts new public responses.
- Each response stores both campaign name and campaign ID.
- New **Campaign Comparison** dashboard page with Campaign A vs Campaign B comparison for overall favourable %, climate index, 8 factors, roles, divisions and question-level change.
- Campaign history is preserved and available to dashboard filters and reports.
- Existing V10.3 action close-out, evidence attachments, Word report and Excel management report remain included.

## Deployment
Upload the contents of this folder to the GitHub repository root. Keep `public/`, `netlify/`, `netlify.toml`, and `package.json` at the root. Netlify publish directory remains `public`.

Recommended commit message:
`V10.4 final - campaign management, comparison dashboard and HSE thresholds`

After Netlify shows **Published**, test in this order:
1. Admin → Data & Reset → Test central storage.
2. Admin → Campaigns → confirm the baseline campaign is Active/Open.
3. Create a Draft campaign, then Activate it and confirm the previous campaign becomes Closed.
4. Open the public survey and submit one test response; confirm it is linked to the new campaign.
5. Dashboard → Campaign Comparison → compare the baseline and new campaign.
6. Confirm Role / Factor / Division bars use Green / Amber / Red thresholds.
7. Test an Action response + evidence attachment + closure.
8. Generate Word and Excel reports.
