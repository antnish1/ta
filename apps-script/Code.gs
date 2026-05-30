const SPREADSHEET_ID = '1lXW_K5pN7kU4hThZI2u-5zWmnZFpvpjd0Xy9bvbcFhE';
const SELECTED_ROWS_SHEET_NAME = 'Selected Rows';
const NEXT_LIST_ID_KEY = 'selectedRowsNextListId';
const HEADERS = [
  'List No.',
  'DATE',
  'Location',
  'Engineer Name',
  'Workshop/Onsite',
  'Call Type',
  'primary / secondary Engineer',
  'Camplaint',
  'Customer Name',
  'Machine No.',
  'HMR',
  'Brekdown status',
  "Site's Location",
  'call id',
];

function doGet(e) {
  const action = e.parameter.action;
  if (action === 'createList') {
    return sendJson(createListId_(), e.parameter.callback);
  }

  if (action === 'getList') {
    return sendJson(getListRows_(e.parameter.listId), e.parameter.callback);
  }

  if (action === 'appendSelectedRows') {
    const payload = JSON.parse(e.parameter.payload || '{}');
    return sendJson(appendSelectedRows_(payload.rows || []), e.parameter.callback);
  }

  return sendJson({ ok: false, error: 'Unknown action.' }, e.parameter.callback);
}

function doPost(e) {
  const payloadText = e.parameter.payload || (e.postData && e.postData.contents) || '{}';
  const payload = JSON.parse(payloadText);

  if (payload.action === 'appendSelectedRows') {
    return sendJson(appendSelectedRows_(payload.rows || []));
  }

  return sendJson({ ok: false, error: 'Unknown action.' });
}

function createListId_() {
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);

  try {
    const props = PropertiesService.getScriptProperties();
    let nextListId = Number(props.getProperty(NEXT_LIST_ID_KEY));
    if (!nextListId) nextListId = getHighestListId_() + 1;

    props.setProperty(NEXT_LIST_ID_KEY, String(nextListId + 1));
    ensureSelectedRowsSheet_();
    return { ok: true, listId: nextListId };
  } finally {
    lock.releaseLock();
  }
}

function appendSelectedRows_(rows) {
  if (!Array.isArray(rows) || rows.length === 0) {
    return { ok: false, error: 'No rows received.' };
  }

  const lock = LockService.getScriptLock();
  lock.waitLock(30000);

  try {
    const sheet = ensureSelectedRowsSheet_();
    const values = rows.map(row => HEADERS.map(header => row[header] || ''));
    sheet.getRange(sheet.getLastRow() + 1, 1, values.length, HEADERS.length).setValues(values);
    return { ok: true, savedRows: values.length };
  } finally {
    lock.releaseLock();
  }
}

function getListRows_(listId) {
  const sheet = ensureSelectedRowsSheet_();
  const values = sheet.getDataRange().getValues();
  const rows = values.slice(1)
    .filter(row => String(row[0]) === String(listId))
    .map(row => {
      const item = {};
      HEADERS.forEach((header, index) => item[header] = row[index] || '');
      return item;
    });

  return { ok: true, rows };
}

function ensureSelectedRowsSheet_() {
  const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = spreadsheet.getSheetByName(SELECTED_ROWS_SHEET_NAME) || spreadsheet.insertSheet(SELECTED_ROWS_SHEET_NAME);

  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS);
  }

  return sheet;
}

function getHighestListId_() {
  const sheet = ensureSelectedRowsSheet_();
  if (sheet.getLastRow() < 2) return 0;

  const ids = sheet.getRange(2, 1, sheet.getLastRow() - 1, 1).getValues()
    .flat()
    .map(Number)
    .filter(id => !Number.isNaN(id));

  return ids.length ? Math.max(...ids) : 0;
}

function sendJson(data, callback) {
  const body = callback ? `${callback}(${JSON.stringify(data)});` : JSON.stringify(data);
  const mime = callback ? ContentService.MimeType.JAVASCRIPT : ContentService.MimeType.JSON;
  return ContentService.createTextOutput(body).setMimeType(mime);
}
