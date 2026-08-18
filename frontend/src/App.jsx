import { useEffect } from "react";
import { Routes, Route } from "react-router-dom";

import MainLayout from "./layout/MainLayout";
import ProtectedRoute from "./components/ProtectedRoute";
import { connectSocket } from "./socket";

import Home from "./pages/Home";
import Buy from "./pages/Buy";
import PropertyDetails from "./pages/PropertyDetails";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import AddProperty from "./pages/AddProperty";

import Chat from "./pages/Chat";

import ChatCenter from "./pages/ChatCenter";

export default function App() {
  useEffect(() => {
    const token = localStorage.getItem("token");

    if (token) {
      connectSocket();
    }
  }, []);

  return (
    <MainLayout>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Home />} />
        <Route path="/buy" element={<Buy />} />
        <Route path="/property/:id" element={<PropertyDetails />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />

<Route path="/chat" element={<ChatCenter />} />

   <Route
  path="/chat/:conversationId"
  element={<Chat />}
/>


 {/* Protected Routes */}

        <Route
          path="/add-property"
          element={
            <ProtectedRoute>
              <AddProperty />
            </ProtectedRoute>
          }
        />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
      </Routes>
    </MainLayout>
  );
}
