# HAJR Safety Climate Survey V5

## New client-requested features
- Voice-to-text microphone button for every question comment / justification.
- Voice-to-text also available for open questions.
- Speech recognition language follows the selected survey language.
- New mandatory Position field: Executive Leader / Director; Project Director / Manager; Engineer / Supervisor; Technician; Labour / Worker.
- Dashboard now includes an Overall tab plus each questionnaire.
- Overall Favourable, Neutral and Unfavourable KPIs.
- HSE-style Favourable responses by Position chart.
- Position labels editable per language from Admin Studio.
- CSV export includes Position.
- Existing V4 cloud config is automatically merged with V5 defaults, preserving previous edits.

## Voice compatibility
Voice-to-text uses browser Speech Recognition. It works best on current Chrome/Edge over HTTPS. If unsupported, typing remains available. Only the transcribed text is stored; no audio recording is saved by the survey.

## Deploying over the existing site
Commit these V5 files to the same GitHub repository. Netlify will deploy automatically, the public URL remains unchanged, and existing Netlify Blobs responses remain available.
