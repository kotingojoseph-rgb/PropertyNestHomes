import { useEffect, useState } from "react";

import DashboardHeader from "../components/dashboard/DashboardHeader";
import DashboardStats from "../components/dashboard/DashboardStats";
import PropertyGrid from "../components/dashboard/PropertyGrid";
import EmptyDashboard from "../components/dashboard/EmptyDashboard";
import SuccessfulDealVideo from "../components/dashboard/SuccessfulDealVideo";
import InvestorDashboard from "./InvestorDashboard";

export default function Dashboard() {
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

  return <InvestorDashboard />;
}

function PropertyDashboard() {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProperties();
  }, []);

  async function loadProperties() {
    try {
      const token = localStorage.getItem("token");

      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/properties/my-properties`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await res.json();

      if (Array.isArray(data)) {
        setProperties(data);
      } else {
        setProperties([]);
      }
    } catch (error) {
      console.error(error);
      setProperties([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm("Delete this property?")) return;

    try {
      const token = localStorage.getItem("token");

      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/properties/${id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (res.ok) {
        loadProperties();
      }
    } catch (error) {
      console.error(error);
    }
  }

  if (loading) {
    return (
      <div className="p-10 text-center text-3xl font-bold">
        Loading...
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl p-8">
      <DashboardHeader />

      <DashboardStats
        totalProperties={properties.length}
      />

      <SuccessfulDealVideo />

      {properties.length === 0 ? (
        <EmptyDashboard />
      ) : (
        <PropertyGrid
          properties={properties}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
}
