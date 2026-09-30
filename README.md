# Safety Climate Survey Platform — V10.11 FINAL CLEAN

V10.11 applies the latest client comments on top of V10.10 without removing existing campaigns, dashboards, reports, actions, raffle data or multilingual content.

## V10.11 client comments completed

- **Executive Dashboard in reports:** Word reports now place an Executive Dashboard Overview immediately after the Executive Summary brief.
- **PowerPoint output:** Report Center now supports Word, Excel and PowerPoint for all three report types. The PPTX is generated locally in the browser using the bundled PowerPoint library.
- **Listen to every question:** Every rating question and every open question has a speaker button. It reads the currently displayed translated question using the selected language (Arabic, English, Urdu, Hindi, Nepali, Bangla, Telugu, Tamil, Malayalam, Chinese or Filipino/Tagalog).
- **Strict single-device survey control:** One survey response per browser/device per campaign is enabled by default. The server stores only a separate one-way device lock; it does not add the device identifier to the anonymous survey response.
- **Raffle strict-device control remains enabled:** One badge = one raffle entry and strict one raffle entry per browser/device remains on by default.
- **Reset Results clears survey device locks:** this allows controlled retesting after an Admin reset.
- Existing tri-colour percentage labels, division/campaign reports, generic wording, 11-language journey, open-question consolidation, QR poster/demo and action close-out remain unchanged.

## Report Center

Choose:
1. Campaign
2. Division
3. Report Type — Management Executive / Detailed Safety Climate / Client Summary
4. Format — **Word / Excel / PowerPoint**

## Deployment

Upload the **contents** of this folder to the existing GitHub repository so `public`, `netlify`, `netlify.toml` and `package.json` remain at repository root. Keep the existing Netlify `ADMIN_KEY`.

After Netlify shows **Published**:
1. Open `/admin.html` and confirm **V10.11 FINAL CLEAN**.
2. Data & Reset → confirm **Enforce one survey response per browser/device per campaign** is checked.
3. Run **Test central storage**.
4. Public survey → select Filipino (then Arabic) → open a questionnaire → press the **speaker icon** on a question and confirm the translated wording is read aloud.
5. Submit one test response. Attempt a second response from the same browser/device in the same campaign and confirm it is blocked.
6. Report Center → generate Word and confirm the Executive Dashboard appears immediately after the Executive Summary brief.
7. Report Center → generate a PowerPoint and open the PPTX.

### Shared-device note
Strict single-device mode intentionally blocks a second survey response from the same browser/device during the same campaign. If a project uses shared kiosks/tablets for many workers, the Admin can disable this control.
