export const getFileUrl = (file) => {
  if (typeof file === "string") {
    return file;
  }

  if (file && typeof file === "object") {
    return file.url || file.downloadUrl || "";
  }

  return "";
};

export const getFileName = (file) => {
  if (file && typeof file === "object" && file.name) {
    return file.name;
  }

  const url = getFileUrl(file);

  if (!url) {
    return "Attachment";
  }

  try {
    const parsedUrl = new URL(url);
    const segments = parsedUrl.pathname.split("/").filter(Boolean);
    return decodeURIComponent(segments.pop() || "Attachment");
  } catch (_error) {
    const segments = url.split("/").filter(Boolean);
    return decodeURIComponent(segments.pop() || "Attachment");
  }
};

export const getFileSearchTerms = (files = []) =>
  files.flatMap((file) => {
    const url = getFileUrl(file);
    const name = getFileName(file);
    const provider = file && typeof file === "object" && file.provider ? file.provider : "";

    return [name, url, provider].filter(Boolean);
  });
