import { Storage } from "@google-cloud/storage";

let storageClient = null;

const normalizeEnvValue = (value, keyName) => {
  const rawValue = value?.trim() || "";

  if (!rawValue) {
    return "";
  }

  let normalizedValue = rawValue.replace(new RegExp(`^${keyName}\\s*=\\s*`, "i"), "").trim();

  if (
    (normalizedValue.startsWith('"') && normalizedValue.endsWith('"')) ||
    (normalizedValue.startsWith("'") && normalizedValue.endsWith("'"))
  ) {
    normalizedValue = normalizedValue.slice(1, -1);
  }

  return normalizedValue.trim();
};

const normalizePemBlock = (value) =>
  value
    .replace(/\\r\\n/g, "\n")
    .replace(/\\n/g, "\n")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "")
    .trim();

const getGcsProjectId = () => normalizeEnvValue(process.env.GCS_PROJECT_ID, "GCS_PROJECT_ID");

const getGcsClientEmail = () => normalizeEnvValue(process.env.GCS_CLIENT_EMAIL, "GCS_CLIENT_EMAIL");

const getGcsPrivateKey = () => {
  const rawValue = normalizeEnvValue(process.env.GCS_PRIVATE_KEY, "GCS_PRIVATE_KEY");

  if (!rawValue) {
    return "";
  }

  if (rawValue.startsWith("{")) {
    try {
      const parsedValue = JSON.parse(rawValue);
      return normalizePemBlock(parsedValue.private_key || rawValue);
    } catch {
      return normalizePemBlock(rawValue);
    }
  }

  const privateKeyMatch = rawValue.match(/"private_key"\s*:\s*"([\s\S]*?)"(?:\s*,|\s*$)/);
  if (privateKeyMatch?.[1]) {
    return normalizePemBlock(privateKeyMatch[1]);
  }

  return normalizePemBlock(rawValue);
};

const getGcsBucketName = () => normalizeEnvValue(process.env.GCS_BUCKET_NAME, "GCS_BUCKET_NAME");

const getGcsFolder = () => normalizeEnvValue(process.env.GCS_FOLDER, "GCS_FOLDER") || "kavach";

export const isGcsConfigured = () =>
  Boolean(getGcsProjectId() && getGcsClientEmail() && getGcsPrivateKey() && getGcsBucketName());

const getStorageClient = () => {
  if (!isGcsConfigured()) {
    return null;
  }

  if (!storageClient) {
    storageClient = new Storage({
      projectId: getGcsProjectId(),
      credentials: {
        client_email: getGcsClientEmail(),
        private_key: getGcsPrivateKey(),
      },
    });
  }

  return storageClient;
};

const sanitizeFileName = (fileName) => fileName.replace(/\s+/g, "-").replace(/[^a-zA-Z0-9-_.]/g, "");

export const uploadBufferToGcs = async (buffer, { fileName, mimeType }) => {
  const client = getStorageClient();

  if (!client) {
    const error = new Error("Google Cloud Storage is not configured.");
    error.statusCode = 500;
    throw error;
  }

  const bucket = client.bucket(getGcsBucketName());
  const objectKey = `${getGcsFolder()}/${Date.now()}-${sanitizeFileName(fileName)}`;
  const file = bucket.file(objectKey);

  await file.save(buffer, {
    resumable: false,
    metadata: {
      contentType: mimeType,
      cacheControl: "public, max-age=31536000",
    },
  });

  const [url] = await file.getSignedUrl({
    action: "read",
    expires: "2500-01-01",
  });

  return {
    id: objectKey,
    name: fileName,
    type: mimeType,
    size: buffer.length,
    provider: "gcs",
    url,
    downloadUrl: url,
  };
};
