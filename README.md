# HAJR Safety Climate Survey V7 — Clean Rebuild

This is a clean rebuild after the V6 dashboard regression. The previous dashboard stopped rendering after the top KPIs because the analytics script referenced an undefined translation helper. V7 centralizes shared helpers in `core.js` and has been rebuilt around one response schema.

## Final client requirements included
- Public survey has **no Dashboard/Admin buttons**.
- 10 languages: English, Arabic, Urdu, Hindi, Nepali, Bangla, Telugu, Tamil, Malayalam, Chinese.
- Exactly five questionnaire/role cards:
  1. Executive Leader / Director
  2. Project Director / Manager
  3. Engineer / Supervisor
  4. Technician
  5. Labour / Worker
- Each role has its own 16-question questionnaire across the 8 Safety Climate factors.
- Optional Comment / Justification under every rating question.
- Strongly Disagree automatically opens the comment box.
- Voice-to-text button on every comment and open question (browser support/permission required). Audio is not stored by the site.
- Central Netlify Functions + Netlify Blobs backend.
- Private Admin at `/admin.html` using Netlify `ADMIN_KEY`.
- Fully editable project branding, names, translations, logos, roles, divisions and questions.
- Dashboard tabs: Overall + each of the five questionnaires.
- Overall/Favourable/Neutral/Unfavourable KPIs.
- HSE-style 3-colour stacked results by Safety Climate factor and by question.
- Project-wide Favourable Responses by Role horizontal chart.
- Favourable Responses by Division.
- Most favourable / most unfavourable question.
- Comments & Justifications feed, including open feedback.
- Recent response table.
- CSV/JSON export and Reset Results.

## Existing cloud data
V7 continues using the same Netlify Blob stores (`hajr-safety-config` and `hajr-safety-responses`) so existing cloud responses are not deleted. Legacy V4/V5/V6 role names are mapped into the new five-role analytics where possible. Old question IDs are shown as Legacy question rows instead of silently disappearing.

## Updating the existing GitHub/Netlify site
Replace the repository contents with this package, commit, and let Netlify redeploy. Keep the existing `ADMIN_KEY` environment variable. No new Netlify site is required.
