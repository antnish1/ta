# Machine No. Row Filter (Google Sheet)

Simple web page that:
- loads data from your Google Sheet (`Sheet1` / `gid=0`),
- filters rows by exact `Machine No.`,
- lets you create progressive list IDs and save selected rows,
- loads selected rows by list ID,
- exports a selected list to Excel.

## Run
Open `index.html` in a browser.

## Google Sheet "Selected Rows" sync
To save/load selected rows in a Google Sheet tab for all users, set an **Apps Script Web App URL** in the page.

Expected Apps Script API:
- `POST ?` body: `{ "action": "appendSelectedRows", "rows": [...] }`
- `GET ?action=getList&listId=<id>` returns: `{ "rows": [...] }`

If URL is not set (or fails), app uses local browser storage fallback.
