# Safety Climate V10.16 — Admin Password Update

Upload these files over the existing project, keeping the same folder paths.

New feature:
- Admin > Data & Reset > Admin Security
- Change production Admin password from inside the site.
- New password becomes active immediately.
- Password is stored server-side as a salted PBKDF2-SHA256 one-way hash.
- Original Netlify ADMIN_KEY becomes the initial bootstrap only.
- Emergency recovery: deliberately rotate ADMIN_KEY in Netlify if the in-app password is forgotten, log in with the newly rotated value, then set a new in-app password.

This update keeps all V10.15.1 Prize Draw reset fixes and existing survey/report functionality.
