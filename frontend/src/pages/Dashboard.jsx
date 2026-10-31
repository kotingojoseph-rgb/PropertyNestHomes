import { useEffect, useState } from "react";

import DashboardHeader from "../components/dashboard/DashboardHeader";
import DashboardStats from "../components/dashboard/DashboardStats";
import PropertyGrid from "../components/dashboard/PropertyGrid";
import EmptyDashboard from "../components/dashboard/EmptyDashboard";
import SuccessfulDealVideo from "../components/dashboard/SuccessfulDealVideo";

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

  return <PropertyDashboard />;
}

function PropertyDashboard() {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [promotions, setPromotions] = useState([]);
  const [promotingPropertyId, setPromotingPropertyId] = useState(null);
  const [promotionNotice, setPromotionNotice] = useState("");

  useEffect(() => {
    loadProperties();

    const params = new URLSearchParams(window.location.search);

    if (params.get("promotion") === "return") {
      setPromotionNotice(
        "Payment returned from Paystack. Checking whether your promotion has been activated."
      );

      window.history.replaceState(
        {},
        document.title,
        window.location.pathname
      );
    }

    loadPromotions();
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

  async function loadPromotions() {
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/promotions`
      );

      if (!res.ok) {
        throw new Error("Unable to load promotion status.");
      }

      const data = await res.json();
      const activePromotions = Array.isArray(data) ? data : [];

      setPromotions(activePromotions);

      const pendingRaw = sessionStorage.getItem(
        "propertyNestHomesPendingPromotion"
      );

      if (pendingRaw) {
        try {
          const pending = JSON.parse(pendingRaw);

          const activated = activePromotions.some(
            (promotion) =>
              Number(promotion.property_id) === Number(pending.propertyId) &&
              String(promotion.plan).toLowerCase() ===
                String(pending.plan).toLowerCase()
          );

          if (activated) {
            setPromotionNotice(
              `Payment confirmed. Your ${pending.plan} promotion is now active.`
            );

            sessionStorage.removeItem(
              "propertyNestHomesPendingPromotion"
            );
          } else {
            setPromotionNotice(
              "Payment return received. Promotion activation is still pending confirmation. Refresh the status shortly."
            );
          }
        } catch (error) {
          console.error("Unable to read pending promotion:", error);
        }
      }
    } catch (error) {
      console.error("Promotion status check failed:", error);
    }
  }

  async function handlePromote(property, plan) {
    const token = localStorage.getItem("token");

    if (!token) {
      setPromotionNotice("Your session has expired. Please log in again.");
      return;
    }

    if (!property?.id || property.verification_status !== "verified") {
      setPromotionNotice("Only verified properties can be promoted.");
      return;
    }

    setPromotionNotice("");
    setPromotingPropertyId(property.id);

    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/payments/initialize`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            property_id: property.id,
            plan,
          }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          data?.error || "Unable to initialize promotion payment."
        );
      }

      const checkout = data?.data || data;

      if (!checkout?.authorization_url || !checkout?.reference) {
        throw new Error("Paystack checkout details were not returned.");
      }

      sessionStorage.setItem(
        "propertyNestHomesPendingPromotion",
        JSON.stringify({
          propertyId: property.id,
          plan,
          reference: checkout.reference,
        })
      );

      window.location.href = checkout.authorization_url;
    } catch (error) {
      console.error("Promotion checkout failed:", error);
      setPromotionNotice(
        error.message || "Unable to start promotion checkout."
      );
      setPromotingPropertyId(null);
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

      const data = await res.json();

      if (res.ok) {
        loadProperties();
      } else {
        alert(data.message || data.error || "Unable to delete property.");
      }
    } catch (error) {
      console.error(error);
    }
  }

  if (loading) {
    return (
      <div className="p-6 text-center text-2xl font-bold sm:p-10 sm:text-3xl">
        Loading...
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-7xl p-1 sm:p-4 md:p-8">
      <DashboardHeader />

      <DashboardStats
        totalProperties={properties.length}
      />

      {promotionNotice && (
        <div className="mt-4 rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900">
          <p>{promotionNotice}</p>
          <button
            type="button"
            onClick={loadPromotions}
            className="mt-2 min-h-10 rounded-lg bg-blue-700 px-4 py-2 font-semibold text-white hover:bg-blue-800"
          >
            Refresh promotion status
          </button>
        </div>
      )}

      {/* Investment Center */}
      <div className="mt-5 overflow-hidden rounded-2xl bg-gradient-to-r from-green-700 to-green-500 p-4 text-white shadow-lg sm:mt-8 sm:p-6 md:p-8">
        <div className="flex flex-col gap-4 sm:gap-6 md:flex-row md:items-center md:justify-between">
          <div className="min-w-0 max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-wide text-green-100">
              Investment Center
            </p>

            <h2 className="mt-2 text-xl font-bold leading-tight sm:text-2xl md:text-3xl">
              Invest in verified real estate opportunities
            </h2>

            <p className="mt-3 text-sm leading-6 text-green-50 sm:text-base">
              Your existing PropertyNestHomes account can also be used
              to invest. Explore verified properties, submit an investment
              request, pay securely with Paystack, and track your portfolio.
              No separate investor registration is required.
            </p>
          </div>

          <a
            href="/investments"
            className="inline-flex min-h-11 w-full shrink-0 items-center justify-center rounded-xl bg-white px-4 py-3 text-sm font-bold text-green-700 shadow transition hover:bg-green-50 sm:w-auto sm:px-6 sm:text-base"
          >
            Explore Investment Opportunities
          </a>
        </div>
      </div>

      <SuccessfulDealVideo />

      {properties.length === 0 ? (
        <EmptyDashboard />
      ) : (
        <PropertyGrid
          properties={properties}
          promotions={promotions}
          promotingPropertyId={promotingPropertyId}
          onPromote={handlePromote}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
}
