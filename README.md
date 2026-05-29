# Machine No. Row Filter (Google Sheet)

Simple web page that:
- loads data from your Google Sheet (`Sheet1` / `gid=0`),
- filters rows by exact `Machine No.`,
- lets users create progressive list IDs and save selected rows,
- saves selected rows into a Google Sheet tab named **Selected Rows** when configured,
- loads selected rows by list ID,
- exports a selected list to Excel.

## Run

Open `index.html` in a browser.

## Important: spreadsheet URL is not enough for saving

A normal Google Sheet URL like `https://docs.google.com/spreadsheets/...` can be used for reading public CSV data, but a browser page cannot write selected rows back to Google Sheets using that URL.

To save selected rows in the Google Sheet, deploy the Apps Script in `apps-script/Code.gs` as a **Web app**, then paste the deployed Web App URL into the page. The URL usually starts with `https://script.google.com/macros/s/` and ends with `/exec`.

## Apps Script setup

1. Open the Google Sheet.
2. Go to **Extensions > Apps Script**.
3. Paste the contents of `apps-script/Code.gs`.
4. Click **Deploy > New deployment**.
5. Choose **Web app**.
6. Set **Execute as** to yourself.
7. Set **Who has access** to the users who need to save rows.
8. Copy the Web App URL ending in `/exec`.
9. Paste that URL into **Apps Script Web App URL for saving to Google Sheet** in `index.html` and click **Save URL**.

The script automatically creates or reuses a tab named **Selected Rows** and appends selected rows with `List No.`.

## Local fallback

If the Apps Script URL is missing or invalid, the page still saves rows in the current browser's `localStorage`, but those rows will not be shared with other users or written to Google Sheets.
