# HAJR Safety Climate Survey V4

This V4 implements the client comments:

## Public link
`/index.html` (or the root URL)
- No Dashboard button
- No Admin Studio button
- Starts with language selection
- 10 languages:
  English, Arabic, Urdu, Hindi, Nepali, Bangla, Telugu, Tamil, Malayalam, Chinese
- Role / questionnaire selection
- Division, company and work area
- Comment / justification option under **every rating question**
- When **Strongly Disagree** is selected, the comment box opens automatically
- Clean compact mobile spacing between questions

## Private admin
`/admin.html`
- Separate login screen
- Dashboard is not exposed on the public page
- Dedicated dashboard for each questionnaire:
  Management / HSE / Engineers & Supervisors / Workers
- HSE-style question charts:
  Unfavourable / Neutral / Favourable
- Most favourable and most unfavourable question
- Safety-climate factor summary
- Favourable result by division
- Comments / justifications feed
- CSV and JSON export

## Editable everything
From Admin Studio:
- Project code
- Project name in every language
- Survey name and description in every language
- Primary/accent colours
- Upload / replace / disable / delete logos
- Enable/disable languages
- Enable/disable questionnaires / roles
- Edit divisions
- Add, edit, duplicate, delete and reorder questions
- Edit every translation
- Change safety-climate factor
- Set negative statement / reverse scoring
- Add/delete open questions
- Reset dashboard without deleting questionnaire settings

## Two deployment modes

### A. Quick Netlify Drop demo
Drag the folder to Netlify Drop.
The website works, but responses/config are stored only in that browser (local demo mode).
Default local Admin PIN: `70330`.

### B. Production shared-data mode (recommended)
Deploy this project using Netlify Git deployment or Netlify CLI so the `netlify/functions` folder and npm dependency are built.

1. Put this folder in a GitHub repository.
2. In Netlify choose **Add new project → Import an existing project**.
3. Select the repository.
4. Netlify will use `netlify.toml`; publish directory is `.`
5. In Netlify go to **Project configuration → Environment variables**.
6. Add:
   `ADMIN_KEY = choose-a-strong-private-password`
7. Deploy.
8. Public survey:
   `https://YOUR-SITE.netlify.app/`
9. Private admin:
   `https://YOUR-SITE.netlify.app/admin.html`

In production mode, Netlify Blobs stores:
- central project configuration
- all survey responses
- dashboard data shared across devices
- settings that persist through new deployments

Do not share the `/admin.html` password with survey respondents.
