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

## Campaigns (Main Quests) as boards
- Quest: `{id,title,icon,due,note,cols:[{id,name,done?}]}`; default columns Ideas, To do, Doing, Blocked, Done (last one has `done:true`).
- Cards are ordinary tasks with `q` (campaign id), `col` (column id), `ord` (sort order). Undated cards have `date:''` and appear only on the board; dated ones also show in Today, Road and councils. Ticking and moving to Done are kept in sync (`syncCol`, `assignCol` in `js/camp.js`).
- Drag and drop: long-press (touch) or click-drag (mouse), ghost card, auto-scroll at edges, undo toast.
- Tasks have optional `note` (links are tappable) and `steps`.

## Version 1.0 (locked 29 Oct 2026)
Today list and Road, smart quick add, task notes with links and steps, Campaigns as boards (Brief, Board, Notes, columns, drag and drop, rank and journey), Side Quests with halls and dice, Dragons (day and week), Day and Week councils, Calendar week view, Firebase sync, installable PWA with auto-update. Tag: v1.0.0.
