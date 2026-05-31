# TA/DA List Builder (Google Sheet)

Simple production-ready web page for two users to:
- create a unique TA/DA List No.,
- choose **Prepared By** without login,
- search Google Sheet rows by exact `Machine No.`,
- add available rows with a `+ Add` button,
- block rows already saved in any list using `DATE + Engineer Name + Machine No.` as `RowKey`,
- enter Total KM and DA type in a modal,
- calculate TA/DA totals automatically,
- print or download the list to Excel.

## Run

Open `index.html` in a browser. The first screen shows **Prepared By** and **Create List**. After list creation, the machine-number search page opens.

## Important Apps Script note

The deployed Apps Script Web App URL is built into `index.html` as `DEFAULT_APPS_SCRIPT_URL`, so users do not see or enter it on the frontend.

Because backend logic now checks duplicate `RowKey` values before saving, you must redeploy `apps-script/Code.gs` after changing it:

1. Open the Google Sheet.
2. Go to **Extensions > Apps Script**.
3. Paste the contents of `apps-script/Code.gs`.
4. Click **Deploy > Manage deployments**.
5. Edit the current Web App deployment or create a new deployment.
6. Set **Execute as** to yourself.
7. Set **Who has access** to the users who need to save rows.
8. If you create a new deployment URL, replace `DEFAULT_APPS_SCRIPT_URL` in `index.html`.

## Google Sheet tabs used

The Apps Script creates/uses:
- `Lists` for List No., Prepared By, and Created At.
- `List_Items` for selected TA/DA rows and duplicate RowKey checks.

## Local fallback

If Apps Script is unavailable, the page can still add rows locally in the current browser, but those rows are not shared with the other user and are not protected by backend duplicate checks.
