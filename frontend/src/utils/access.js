import { departments } from "../constants/departments";

export const getAssignedDepartments = (user) => {
  const assigned = Array.isArray(user?.departments) ? user.departments : [];
  return [...new Set([...assigned, user?.department].filter((department) => departments.includes(department)))];
};

export const getVisibleDepartments = (user) => (user?.role === "admin" || user?.role === "viewer" ? departments : getAssignedDepartments(user));

export const isReadOnlyUser = (user) => user?.role === "viewer";

export const getRoleLabel = (role) => {
  if (role === "viewer") {
    return "Admin Viewer";
  }

  return role === "admin" ? "Admin" : "Staff";
};
