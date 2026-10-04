V10.15.1 RAFFLE RESET HOTFIX

Fixes: Admin > Prize Draw > Clear Prize Draw Data returned "Not found".
Cause: the frontend button called action=raffle-reset, but the deployed survey function did not contain the raffle-reset route.

Upload this file preserving the same path:
netlify/functions/survey.mjs

The reset deletes ONLY:
- Prize Draw participants
- Prize Draw device locks
- Prize Draw history / previous winners

It does NOT delete:
- Survey responses
- Survey device locks
- Campaigns
- Configuration
- Dashboard data
