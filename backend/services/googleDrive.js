import crypto from "crypto";

const DRIVE_SCOPE = "https://www.googleapis.com/auth/drive.file";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_DRIVE_UPLOAD_URL = "https://www.googleapis.com/upload/drive/v3/files";
const GOOGLE_DRIVE_PERMISSIONS_URL = "https://www.googleapis.com/drive/v3/files";

let accessTokenCache = {
  token: null,
  expiresAt: 0,
};

const toBase64Url = (value) =>
  Buffer.from(typeof value === "string" ? value : JSON.stringify(value))
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");

const getGoogleDrivePrivateKey = () => {
  const rawValue = process.env.GOOGLE_DRIVE_PRIVATE_KEY?.trim() || "";

  if (!rawValue) {
    return "";
  }

  let normalizedValue = rawValue;

  // Accept a whole JSON blob pasted into the env value.
  if (normalizedValue.startsWith("{")) {
    try {
      const parsedValue = JSON.parse(normalizedValue);
      normalizedValue = parsedValue.private_key || normalizedValue;
    } catch {
      // Fall through and try looser parsing below.
    }
  }

  // Accept a copied JSON property snippet such as: "private_key": "..."
  const privateKeyMatch = normalizedValue.match(/"private_key"\s*:\s*"([\s\S]*?)"(?:\s*,|\s*$)/);
  if (privateKeyMatch?.[1]) {
    normalizedValue = privateKeyMatch[1];
  }

  normalizedValue = normalizedValue.replace(/^GOOGLE_DRIVE_PRIVATE_KEY\s*=\s*/i, "").trim();

  if (
    (normalizedValue.startsWith('"') && normalizedValue.endsWith('"')) ||
    (normalizedValue.startsWith("'") && normalizedValue.endsWith("'"))
  ) {
    normalizedValue = normalizedValue.slice(1, -1);
  }

  return normalizedValue
    .replace(/\\r\\n/g, "\n")
    .replace(/\\n/g, "\n")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "")
    .trim();
};

export const isGoogleDriveConfigured = () =>
  Boolean(process.env.GOOGLE_DRIVE_CLIENT_EMAIL && getGoogleDrivePrivateKey() && process.env.GOOGLE_DRIVE_FOLDER_ID);

const createSignedJwt = () => {
  const issuedAt = Math.floor(Date.now() / 1000);
  const expiresAt = issuedAt + 3600;
  const header = { alg: "RS256", typ: "JWT" };
  const payload = {
    iss: process.env.GOOGLE_DRIVE_CLIENT_EMAIL,
    scope: DRIVE_SCOPE,
    aud: GOOGLE_TOKEN_URL,
    iat: issuedAt,
    exp: expiresAt,
  };

  const encodedHeader = toBase64Url(header);
  const encodedPayload = toBase64Url(payload);
  const unsignedToken = `${encodedHeader}.${encodedPayload}`;

  const signer = crypto.createSign("RSA-SHA256");
  signer.update(unsignedToken);
  signer.end();

  const signature = signer
    .sign(getGoogleDrivePrivateKey(), "base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");

  return `${unsignedToken}.${signature}`;
};

const getAccessToken = async () => {
  if (accessTokenCache.token && Date.now() < accessTokenCache.expiresAt) {
    return accessTokenCache.token;
  }

  const body = new URLSearchParams({
    grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
    assertion: createSignedJwt(),
  });

  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });

  const payload = await response.json();

  if (!response.ok || !payload.access_token) {
    const error = new Error(payload.error_description || payload.error || "Failed to authenticate with Google Drive.");
    error.statusCode = 502;
    throw error;
  }

  accessTokenCache = {
    token: payload.access_token,
    expiresAt: Date.now() + Math.max((payload.expires_in || 3600) - 60, 60) * 1000,
  };

  return accessTokenCache.token;
};

const buildMultipartBody = (metadata, buffer, mimeType, boundary) =>
  Buffer.concat([
    Buffer.from(`--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}\r\n`),
    Buffer.from(`--${boundary}\r\nContent-Type: ${mimeType}\r\n\r\n`),
    buffer,
    Buffer.from(`\r\n--${boundary}--`),
  ]);

export const uploadBufferToGoogleDrive = async (buffer, { fileName, mimeType }) => {
  const accessToken = await getAccessToken();
  const boundary = `kavach-${crypto.randomUUID()}`;
  const metadata = {
    name: fileName,
    parents: [process.env.GOOGLE_DRIVE_FOLDER_ID],
  };

  const uploadResponse = await fetch(
    `${GOOGLE_DRIVE_UPLOAD_URL}?uploadType=multipart&fields=id,name,mimeType,size&supportsAllDrives=true`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": `multipart/related; boundary=${boundary}`,
      },
      body: buildMultipartBody(metadata, buffer, mimeType, boundary),
    }
  );

  const uploadedFile = await uploadResponse.json();

  if (!uploadResponse.ok || !uploadedFile.id) {
    const error = new Error(uploadedFile.error?.message || "Failed to upload file to Google Drive.");
    error.statusCode = 502;
    throw error;
  }

  const permissionResponse = await fetch(`${GOOGLE_DRIVE_PERMISSIONS_URL}/${uploadedFile.id}/permissions?supportsAllDrives=true`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      role: "reader",
      type: "anyone",
    }),
  });

  if (!permissionResponse.ok) {
    const permissionPayload = await permissionResponse.json().catch(() => ({}));
    const error = new Error(permissionPayload.error?.message || "File uploaded but failed to update Google Drive sharing permissions.");
    error.statusCode = 502;
    throw error;
  }

  return {
    id: uploadedFile.id,
    name: uploadedFile.name || fileName,
    type: uploadedFile.mimeType || mimeType,
    size: Number(uploadedFile.size) || buffer.length,
    provider: "google-drive",
    url: `https://drive.google.com/file/d/${uploadedFile.id}/view`,
    downloadUrl: `https://drive.google.com/uc?id=${uploadedFile.id}&export=download`,
  };
};
