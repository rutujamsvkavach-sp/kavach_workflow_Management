export const departments = [
  "DPR",
  "DESIGN CHECKING",
  "DOCUMENT",
  "MONITORING",
  "WORKS",
  "LOCO TRIALS",
  "SITE WORK IMAGES",
  "TELECOM RECORDS",
  "CIVIL",
  "TAG PLACEMENT PLANS",
  "ACCOUNTS",
];

export const resolveUserDepartments = (user) => {
  const assigned = Array.isArray(user?.departments) ? user.departments : [];

  return [...new Set([...assigned, user?.department].map((department) => String(department || "").trim()).filter((department) => departments.includes(department)))];
};
