# Machine No. Row Filter (Google Sheet)

Simple web page that:
- loads data from your Google Sheet (`Sheet1` / `gid=0`),
- filters rows by exact `Machine No.`,
- lets users create progressive list IDs and save selected rows,
- saves selected rows into a Google Sheet tab named **Selected Rows** using the built-in Apps Script Web App URL,
- loads selected rows by list ID,
- exports a selected list to Excel.

## Run

Open `index.html` in a browser.

## Important: spreadsheet URL is not enough for saving

A normal Google Sheet URL like `https://docs.google.com/spreadsheets/...` can be used for reading public CSV data, but a browser page cannot write selected rows back to Google Sheets using that URL.

The deployed Apps Script Web App URL is now built into `index.html`, so users do not need to paste it every time. If you deploy a new Apps Script Web App later, paste the new URL into the page and click **Save URL** to override the built-in default in that browser.

## Apps Script setup / redeploying

The current deployed Web App URL is already configured in the code. Use these steps only if you need to redeploy or replace it:

1. Open the Google Sheet.
2. Go to **Extensions > Apps Script**.
3. Paste the contents of `apps-script/Code.gs`.
4. Click **Deploy > New deployment**.
5. Choose **Web app**.
6. Set **Execute as** to yourself.
7. Set **Who has access** to the users who need to save rows.
8. Copy the Web App URL ending in `/exec`.
9. Replace `DEFAULT_APPS_SCRIPT_URL` in `index.html`, or paste the new URL into **Apps Script Web App URL for saving to Google Sheet** on the page and click **Save URL** for that browser.

The script automatically creates or reuses a tab named **Selected Rows** and appends selected rows with `List No.`.

## Local fallback

If the built-in Apps Script URL is removed, overridden with an invalid URL, or temporarily unavailable, the page still saves rows in the current browser's `localStorage`, but those rows will not be shared with other users or written to Google Sheets.
