import { Navigate, Route, Routes, useParams } from "react-router-dom";

import { useAuth } from "./context/AuthContext";
import AdminPage from "./pages/AdminPage";
import DashboardPage from "./pages/DashboardPage";
import DepartmentPage from "./pages/DepartmentPage";
import DprPage from "./pages/DprPage";
import LoginPage from "./pages/LoginPage";
import NotFoundPage from "./pages/NotFoundPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";

const ProtectedRoute = ({ children, adminOnly = false, department }) => {
  const { isAuthenticated, user } = useAuth();
  const { departmentName } = useParams();
  const requestedDepartment = department || decodeURIComponent(departmentName || "");

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (adminOnly && user?.role !== "admin") {
    return <Navigate to="/" replace />;
  }

  if (requestedDepartment && user?.role === "staff" && user.department !== requestedDepartment) {
    return <Navigate to="/" replace />;
  }

  return children;
};

const App = () => (
  <Routes>
    <Route path="/login" element={<LoginPage />} />
    <Route path="/reset-password" element={<ResetPasswordPage />} />
    <Route
      path="/"
      element={
        <ProtectedRoute>
          <DashboardPage />
        </ProtectedRoute>
      }
    />
    <Route
      path="/departments/DPR"
      element={
        <ProtectedRoute department="DPR">
          <DprPage />
        </ProtectedRoute>
      }
    />
    <Route
      path="/departments/:departmentName"
      element={
        <ProtectedRoute>
          <DepartmentPage />
        </ProtectedRoute>
      }
    />
    <Route
      path="/admin"
      element={
        <ProtectedRoute adminOnly>
          <AdminPage />
        </ProtectedRoute>
      }
    />
    <Route path="*" element={<NotFoundPage />} />
  </Routes>
);

export default App;
