import { google } from "googleapis";

const DEFAULT_USERS_SHEET = process.env.USERS_SHEET_NAME || "USERS";
const DEFAULT_DEPARTMENTS_SHEET = process.env.DEPARTMENTS_SHEET_NAME || "DEPARTMENTS";

const getAuthClient = () => {
  const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!process.env.GOOGLE_SHEETS_ID || !clientEmail || !privateKey) {
    throw new Error("Google Sheets environment variables are not configured.");
  }

  return new google.auth.JWT({
    email: clientEmail,
    key: privateKey,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
};

const getSheetsApi = async () => {
  const auth = getAuthClient();
  await auth.authorize();

  return google.sheets({
    version: "v4",
    auth,
  });
};

const getHeadersAndRows = async (sheetName) => {
  const sheets = await getSheetsApi();
  const spreadsheetId = process.env.GOOGLE_SHEETS_ID;
  const range = `${sheetName}!A:Z`;

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range,
  });

  const rows = response.data.values || [];
  const headers = rows[0] || [];
  const bodyRows = rows.slice(1);

  return { sheets, spreadsheetId, headers, bodyRows };
};

const mapRow = (headers, row, rowIndex) => {
  const record = headers.reduce((accumulator, header, index) => {
    accumulator[header] = row[index] ?? "";
    return accumulator;
  }, {});

  record._rowNumber = rowIndex + 2;
  return record;
};

const normalizeForWrite = (headers, payload) =>
  headers.map((header) => {
    const value = payload[header];
    return value === undefined || value === null ? "" : String(value);
  });

export const sheetNames = {
  users: DEFAULT_USERS_SHEET,
  departments: DEFAULT_DEPARTMENTS_SHEET,
};

export const getAllRows = async (sheetName) => {
  const { headers, bodyRows } = await getHeadersAndRows(sheetName);
  return bodyRows.map((row, index) => mapRow(headers, row, index));
};

export const findRowByColumn = async (sheetName, columnName, value) => {
  const rows = await getAllRows(sheetName);
  return rows.find((row) => String(row[columnName]).toLowerCase() === String(value).toLowerCase()) || null;
};

export const appendRow = async (sheetName, payload) => {
  const { sheets, spreadsheetId, headers } = await getHeadersAndRows(sheetName);
  const values = [normalizeForWrite(headers, payload)];

  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: `${sheetName}!A:Z`,
    valueInputOption: "USER_ENTERED",
    requestBody: { values },
  });

  return payload;
};

export const updateRowById = async (sheetName, id, payload) => {
  const { sheets, spreadsheetId, headers, bodyRows } = await getHeadersAndRows(sheetName);
  const mappedRows = bodyRows.map((row, index) => mapRow(headers, row, index));
  const existing = mappedRows.find((row) => row.id === id);

  if (!existing) {
    return null;
  }

  const merged = { ...existing, ...payload };
  const values = [normalizeForWrite(headers, merged)];

  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `${sheetName}!A${existing._rowNumber}:Z${existing._rowNumber}`,
    valueInputOption: "USER_ENTERED",
    requestBody: { values },
  });

  return merged;
};

export const deleteRowById = async (sheetName, id) => {
  const sheets = await getSheetsApi();
  const spreadsheetId = process.env.GOOGLE_SHEETS_ID;
  const metadata = await sheets.spreadsheets.get({ spreadsheetId });
  const targetSheet = metadata.data.sheets?.find((sheet) => sheet.properties?.title === sheetName);

  if (!targetSheet?.properties?.sheetId) {
    throw new Error(`Sheet ${sheetName} not found.`);
  }

  const rows = await getAllRows(sheetName);
  const existing = rows.find((row) => row.id === id);

  if (!existing) {
    return false;
  }

  await sheets.spreadsheets.batchUpdate({
    spreadsheetId,
    requestBody: {
      requests: [
        {
          deleteDimension: {
            range: {
              sheetId: targetSheet.properties.sheetId,
              dimension: "ROWS",
              startIndex: existing._rowNumber - 1,
              endIndex: existing._rowNumber,
            },
          },
        },
      ],
    },
  });

  return true;
};
