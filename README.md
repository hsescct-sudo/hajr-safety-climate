# V10.1 Emergency Save Verification Fix

This patch fixes the false **"saved configuration did not round-trip correctly"** error.

## What changed
- `save-config` now writes the config, reads the exact object back with **strong consistency**, and returns it in the same response.
- The Admin verifies the **raw stored object** before any migration/default normalization.
- Server-managed metadata such as `updatedAt` no longer causes a false verification failure.
- Auto-save remains enabled for Project & Branding, Questions, Languages, Roles, Divisions, Logos and theme.

## Upload
For the smallest update, replace these files on GitHub:
- `public/admin.js`
- `netlify/functions/survey.mjs`

The full package also includes the root mirror `admin.js`.

After Netlify shows **Published**, hard refresh the Admin page (`Ctrl+F5`), change the project name, press **Save now**, and then open the public survey in an Incognito window to confirm the saved name.
