# HAJR Safety Climate Survey — V10.3 FINAL CLEAN

Production-ready Safety Climate Survey platform for **70330 – HAJR Expansion Project**.

## V10.3 highlights

- Power BI-style interactive dashboard with cross-filtering, drill-through and management visuals.
- Four questionnaire roles only: Executive Leader / Director; Project Director / Manager; Engineer / Supervisor / Technician; Labour / Worker.
- No contractor/company filter or contractor comparison.
- 10 survey languages, RTL support and voice-to-text comments.
- Central Netlify Blob storage for configuration and survey responses.
- **Action Management workflow**: open an action, edit owner/target/recommended action, record Action Taken / Response, attach close-out evidence, change status and formally close the action. Closed actions require a response plus at least one evidence attachment.
- Action records and evidence are stored centrally and included in management reports.
- **Word Management Report** now includes project logos, executive summary, factor/role/division visual charts, question analysis, comments and a full Action Plan & Close-out section.
- **Excel Management Report** is now a formatted visual report with factor, role and division charts, question sentiment analysis and the Action Plan & Close-out register.
- Raw survey data remains available from Admin → Data & Reset as CSV / JSON.

## Deploy

Upload the complete contents of this folder/release ZIP to the GitHub repository root while preserving:

```
public/
netlify/
netlify.toml
package.json
README.md
DEPLOY_CHECKLIST.txt
```

Netlify build settings remain:

- Publish directory: `public`
- Functions directory: `netlify/functions`
- Environment variable: `ADMIN_KEY`

After Netlify shows **Published**, open `/admin.html`, confirm the header says **V10.3 FINAL CLEAN**, then run **Data & Reset → Test central storage**.

## Recommended live test

1. Sign in to Admin.
2. Run Test central storage.
3. Submit one public survey response including a comment.
4. Refresh dashboard and open a question drill-through.
5. Generate Actions → Manage one action.
6. Enter Action Taken / Response, attach evidence and save it as In Progress.
7. Reopen the action and confirm the response/evidence persisted.
8. Mark Closed (requires response + evidence).
9. Download Word Report and Excel Report and confirm the action close-out information is included.

## Storage

V10.3 uses the existing response/config stores and adds two central stores for action management:

- `hajr-safety-config`
- `hajr-safety-responses`
- `hajr-safety-actions`
- `hajr-safety-action-files`

V10.3 keeps the same core survey schema (`hajr-safety-climate-v10`) for compatibility with existing configuration and responses.
