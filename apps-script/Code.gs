const SPREADSHEET_ID = '1lXW_K5pN7kU4hThZI2u-5zWmnZFpvpjd0Xy9bvbcFhE';
const LISTS_SHEET_NAME = 'Lists';
const LIST_ITEMS_SHEET_NAME = 'List_Items';
const NEXT_LIST_ID_KEY = 'taDaNextListId';

const LIST_HEADERS = ['List No.', 'Prepared By', 'Created At'];
const ITEM_HEADERS = [
  'List No.',
  'Prepared By',
  'RowKey',
  'S.No.',
  'Entry Date',
  'Engineer Name',
  'Call Type',
  'Complaint',
  'Customer Name',
  'Machine No.',
  'Call ID',
  'Labour Charge',
  "Site's Location",
  'Total KM',
  'TA Rate',
  'Total TA',
  'TA Amt.',
  'DA Type',
  'DA Amount',
  'Hotel Charges',
  'Total TA + DA',
];

function doGet(e) {
  const action = e.parameter.action;

  if (action === 'createList') {
    const payload = parsePayload_(e.parameter.payload);
    return sendJson(createList_(payload.preparedBy), e.parameter.callback);
  }

  if (action === 'getList') {
    return sendJson(getList_(e.parameter.listId), e.parameter.callback);
  }

  if (action === 'getExistingRows') {
    const payload = parsePayload_(e.parameter.payload);
    return sendJson(getExistingRows_(payload.rowKeys || []), e.parameter.callback);
  }

  if (action === 'appendListItem') {
    const payload = parsePayload_(e.parameter.payload);
    return sendJson(appendListItem_(payload.item), e.parameter.callback);
  }

  return sendJson({ ok: false, error: 'Unknown action.' }, e.parameter.callback);
}

function doPost(e) {
  const payload = parsePayload_((e.parameter && e.parameter.payload) || (e.postData && e.postData.contents));

  if (payload.action === 'appendListItem') {
    return sendJson(appendListItem_(payload.item));
  }

  if (payload.action === 'appendSelectedRows') {
    const item = (payload.rows || [])[0];
    return sendJson(appendListItem_(item));
  }

  return sendJson({ ok: false, error: 'Unknown action.' });
}

function createList_(preparedBy) {
  if (!preparedBy) return { ok: false, error: 'Prepared By is required.' };

  const lock = LockService.getScriptLock();
  lock.waitLock(30000);

  try {
    const listsSheet = ensureSheet_(LISTS_SHEET_NAME, LIST_HEADERS);
    ensureSheet_(LIST_ITEMS_SHEET_NAME, ITEM_HEADERS);

    const props = PropertiesService.getScriptProperties();
    let nextListId = Number(props.getProperty(NEXT_LIST_ID_KEY));
    if (!nextListId) nextListId = getHighestListId_(listsSheet) + 1;

    listsSheet.appendRow([nextListId, preparedBy, new Date()]);
    props.setProperty(NEXT_LIST_ID_KEY, String(nextListId + 1));

    return { ok: true, listId: nextListId, preparedBy };
  } finally {
    lock.releaseLock();
  }
}

function appendListItem_(item) {
  if (!item) return { ok: false, error: 'No row received.' };
  if (!item.RowKey) return { ok: false, error: 'RowKey is required.' };

  const lock = LockService.getScriptLock();
  lock.waitLock(30000);

  try {
    const sheet = ensureSheet_(LIST_ITEMS_SHEET_NAME, ITEM_HEADERS);
    const existing = findExistingRow_(sheet, item.RowKey);
    if (existing) {
      return { ok: false, duplicate: true, existingListNo: existing.listNo, error: `Already added in List No. ${existing.listNo}` };
    }

    const values = ITEM_HEADERS.map(header => item[header] === undefined || item[header] === null ? '' : item[header]);
    sheet.getRange(sheet.getLastRow() + 1, 1, 1, ITEM_HEADERS.length).setValues([values]);
    return { ok: true, savedRows: 1, item };
  } finally {
    lock.releaseLock();
  }
}

function getExistingRows_(rowKeys) {
  const sheet = ensureSheet_(LIST_ITEMS_SHEET_NAME, ITEM_HEADERS);
  const existing = {};
  if (sheet.getLastRow() < 2) return { ok: true, existing };

  const values = sheet.getRange(2, 1, sheet.getLastRow() - 1, ITEM_HEADERS.length).getValues();
  const wanted = Array.isArray(rowKeys) && rowKeys.length ? new Set(rowKeys.map(String)) : null;

  values.forEach(row => {
    const listNo = row[0];
    const rowKey = String(row[2] || '');
    if (!rowKey) return;
    if (!wanted || wanted.has(rowKey)) existing[rowKey] = listNo;
  });

  return { ok: true, existing };
}

function getList_(listId) {
  const listsSheet = ensureSheet_(LISTS_SHEET_NAME, LIST_HEADERS);
  const itemsSheet = ensureSheet_(LIST_ITEMS_SHEET_NAME, ITEM_HEADERS);
  const metadata = getListMetadata_(listsSheet, listId);
  const rows = [];

  if (itemsSheet.getLastRow() >= 2) {
    const values = itemsSheet.getRange(2, 1, itemsSheet.getLastRow() - 1, ITEM_HEADERS.length).getValues();
    values.forEach(row => {
      if (String(row[0]) !== String(listId)) return;
      const item = {};
      ITEM_HEADERS.forEach((header, index) => item[header] = row[index] === undefined || row[index] === null ? '' : row[index]);
      rows.push(item);
    });
  }

  return { ok: true, listId, preparedBy: metadata.preparedBy || '', createdAt: metadata.createdAt || '', rows };
}

function getListMetadata_(sheet, listId) {
  if (sheet.getLastRow() < 2) return {};
  const values = sheet.getRange(2, 1, sheet.getLastRow() - 1, LIST_HEADERS.length).getValues();
  const row = values.find(item => String(item[0]) === String(listId));
  return row ? { preparedBy: row[1], createdAt: row[2] } : {};
}

function findExistingRow_(sheet, rowKey) {
  if (sheet.getLastRow() < 2) return null;
  const values = sheet.getRange(2, 1, sheet.getLastRow() - 1, 3).getValues();
  const match = values.find(row => String(row[2]) === String(rowKey));
  return match ? { listNo: match[0] } : null;
}

function ensureSheet_(name, headers) {
  const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = spreadsheet.getSheetByName(name) || spreadsheet.insertSheet(name);

  if (sheet.getLastRow() === 0) {
    sheet.appendRow(headers);
  } else {
    const currentHeaders = sheet.getRange(1, 1, 1, Math.max(sheet.getLastColumn(), headers.length)).getValues()[0];
    const needsHeader = headers.some((header, index) => currentHeaders[index] !== header);
    if (needsHeader) sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  }

  return sheet;
}

function getHighestListId_(sheet) {
  if (sheet.getLastRow() < 2) return 0;
  const ids = sheet.getRange(2, 1, sheet.getLastRow() - 1, 1).getValues()
    .flat()
    .map(Number)
    .filter(id => !Number.isNaN(id));

  return ids.length ? Math.max(...ids) : 0;
}

function parsePayload_(payloadText) {
  if (!payloadText) return {};
  try {
    return JSON.parse(payloadText);
  } catch (err) {
    return {};
  }
}

function sendJson(data, callback) {
  const body = callback ? `${callback}(${JSON.stringify(data)});` : JSON.stringify(data);
  const mime = callback ? ContentService.MimeType.JAVASCRIPT : ContentService.MimeType.JSON;
  return ContentService.createTextOutput(body).setMimeType(mime);
}
