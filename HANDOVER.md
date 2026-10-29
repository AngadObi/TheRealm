# The Realm: handover

Solo task manager PWA with the knight Sir Reg. Full notes live in two Claude docs:

- Handover: https://claude.ai/artifact/AihgrLrm6RdBLs8Bp1FhAw
- Design guide 4.3: https://claude.ai/artifact/9MJVDz5ZcK49PQzA76G2gw

## Quick facts
- Live: https://angadobi.github.io/TheRealm/ (GitHub Pages, deploys on push to main)
- Source: `source/` (js/, style.css, build.py, build_site.py, site-src/, knight/, mklib.py, lines.json)
- Ship: edit source, run `build.py` then `build_site.py`, copy `site/` contents to the repo root, push. The installed app updates itself.
- Sync: Firebase project `the-realm-f6b41` (Firestore + Google sign-in), config in `firebase-config.js`.
- Open: Android reminders (FCM + scheduled function), two-device sync test, line/face tuning.
- Rules from the user: concise and honest, no em dashes, metric units, finish work proactively.
