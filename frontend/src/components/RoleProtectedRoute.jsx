import { Navigate } from "react-router-dom";

export default function RoleProtectedRoute({
  children,
  allowedRoles = [],
}) {
  const token = localStorage.getItem("token");

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  let user = null;

  try {
    const storedUser = localStorage.getItem("user");

    if (storedUser) {
      user = JSON.parse(storedUser);
    }
  } catch (error) {
    console.error("Unable to read stored user:", error);
  }

  const userRole = String(user?.role || "")
    .trim()
    .toLowerCase();

  if (!allowedRoles.includes(userRole)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
