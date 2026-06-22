import { departments } from "../constants/departments";

export const getAssignedDepartments = (user) => {
  const assigned = Array.isArray(user?.departments) ? user.departments : [];
  return [...new Set([...assigned, user?.department].filter((department) => departments.includes(department)))];
};

export const getVisibleDepartments = (user) => (user?.role === "admin" ? departments : getAssignedDepartments(user));
