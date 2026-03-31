const normalizeValue = (value) =>
  String(value || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s/-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

export const buildSearchTokens = (query) => normalizeValue(query).split(" ").filter(Boolean);

export const matchesSearch = (query, fields) => {
  const tokens = buildSearchTokens(query);

  if (!tokens.length) {
    return true;
  }

  const haystacks = fields
    .map((field) => normalizeValue(field))
    .filter(Boolean);

  return tokens.every((token) => haystacks.some((value) => value.includes(token)));
};
