export const DOCUMENT_SOURCE_OPTIONS = [
  { value: "file", label: "Upload File" },
  { value: "link", label: "Upload Link" },
];

export const isHttpUrl = (value) => /^https?:\/\/.+/i.test(String(value || "").trim());

export const isDriveLink = (value) => /drive\.google\.com|docs\.google\.com/i.test(String(value || ""));

export const truncateUrl = (value, maxLength = 38) => {
  const url = String(value || "").trim();

  if (!url || url.length <= maxLength) {
    return url;
  }

  return `${url.slice(0, maxLength - 3)}...`;
};

export const getStoredDocumentType = ({ metaType = "", recordType = "", link = "", files = [] }) => {
  if (metaType === "link" || recordType === "link") {
    return "link";
  }

  if (String(link || "").trim() && !(files || []).length) {
    return "link";
  }

  return "file";
};

