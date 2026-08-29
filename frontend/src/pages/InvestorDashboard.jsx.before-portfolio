import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

export default function InvestorDashboard() {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadInvestmentOpportunities();
  }, []);

  async function loadInvestmentOpportunities() {
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/properties`
      );

      const data = await res.json();

      if (Array.isArray(data)) {
        setProperties(data);
      } else if (Array.isArray(data?.properties)) {
        setProperties(data.properties);
      } else {
        setProperties([]);
      }
    } catch (error) {
      console.error("Unable to load investment opportunities:", error);
      setProperties([]);
    } finally {
      setLoading(false);
    }
  }

  function getPropertyTitle(property) {
    return (
      property.title ||
      property.name ||
      property.property_name ||
      "Investment Property"
    );
  }

  function getPropertyLocation(property) {
    return (
      property.location ||
      property.city ||
      property.address ||
      "Location available on property details"
    );
  }

  function getPropertyImage(property) {
    return (
      property.image_url ||
      property.image ||
      property.photo_url ||
      property.images?.[0] ||
      "/property.jpg"
    );
  }

  function getPropertyPrice(property) {
    const price = property.price;

    if (price === undefined || price === null || price === "") {
      return "Price available on request";
    }

    const numericPrice = Number(price);

    if (Number.isNaN(numericPrice)) {
      return String(price);
    }

    return `₦${numericPrice.toLocaleString()}`;
  }

  return (
    <div className="mx-auto max-w-7xl p-6 md:p-8">
      <div className="mb-8 rounded-2xl bg-gradient-to-r from-green-700 to-green-500 p-6 text-white shadow-lg">
        <p className="text-sm font-medium uppercase tracking-wide text-green-100">
          Investor Dashboard
        </p>

        <h1 className="mt-2 text-3xl font-bold md:text-4xl">
          Discover your next real estate opportunity
        </h1>

        <p className="mt-3 max-w-2xl text-green-50">
          Explore properties available on PropertyNestHomes and identify
          opportunities that match your investment goals.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl bg-white p-6 shadow">
          <div className="text-sm text-gray-500">
            Available Opportunities
          </div>

          <div className="mt-2 text-3xl font-bold text-gray-900">
            {loading ? "..." : properties.length}
          </div>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow">
          <div className="text-sm text-gray-500">
            Investment Portfolio
          </div>

          <div className="mt-2 text-3xl font-bold text-gray-900">
            0
          </div>

          <p className="mt-1 text-sm text-gray-500">
            Portfolio tracking coming soon
          </p>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow">
          <div className="text-sm text-gray-500">
            Investment Returns
          </div>

          <div className="mt-2 text-3xl font-bold text-gray-900">
            ₦0
          </div>

          <p className="mt-1 text-sm text-gray-500">
            Returns tracking coming soon
          </p>
        </div>
      </div>

      <div className="mt-10">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Investment Opportunities
            </h2>

            <p className="mt-1 text-gray-500">
              Browse properties currently available on PropertyNestHomes.
            </p>
          </div>

          <Link
            to="/buy"
            className="rounded-lg bg-green-600 px-4 py-2 font-medium text-white hover:bg-green-700"
          >
            Browse All
          </Link>
        </div>

        {loading ? (
          <div className="rounded-2xl bg-white p-10 text-center shadow">
            <p className="text-gray-500">
              Loading investment opportunities...
            </p>
          </div>
        ) : properties.length === 0 ? (
          <div className="rounded-2xl bg-white p-10 text-center shadow">
            <div className="text-4xl">🏠</div>

            <h3 className="mt-3 text-xl font-bold text-gray-900">
              No opportunities available yet
            </h3>

            <p className="mt-2 text-gray-500">
              New properties will appear here when they become available.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {properties.slice(0, 6).map((property) => (
              <Link
                key={property.id}
                to={`/property/${property.id}`}
                className="overflow-hidden rounded-2xl bg-white shadow transition hover:-translate-y-1 hover:shadow-lg"
              >
                <img
                  src={getPropertyImage(property)}
                  alt={getPropertyTitle(property)}
                  className="h-48 w-full object-cover"
                  onError={(event) => {
                    event.currentTarget.src = "/property.jpg";
                  }}
                />

                <div className="p-5">
                  <h3 className="text-lg font-bold text-gray-900">
                    {getPropertyTitle(property)}
                  </h3>

                  <p className="mt-1 text-sm text-gray-500">
                    📍 {getPropertyLocation(property)}
                  </p>

                  <div className="mt-4 flex items-center justify-between">
                    <span className="font-bold text-green-700">
                      {getPropertyPrice(property)}
                    </span>

                    <span className="text-sm font-medium text-green-600">
                      View opportunity →
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      <div className="mt-10 rounded-2xl border border-green-100 bg-green-50 p-6">
        <h2 className="text-xl font-bold text-gray-900">
          Investor Features
        </h2>

        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <div className="rounded-xl bg-white p-4">
            <div className="text-2xl">📊</div>
            <h3 className="mt-2 font-bold">
              Portfolio Tracking
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Track properties you invest in and monitor performance.
            </p>
          </div>

          <div className="rounded-xl bg-white p-4">
            <div className="text-2xl">💰</div>
            <h3 className="mt-2 font-bold">
              Investment Returns
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Monitor investment value and returns as the platform develops.
            </p>
          </div>

          <div className="rounded-xl bg-white p-4">
            <div className="text-2xl">🔔</div>
            <h3 className="mt-2 font-bold">
              Opportunity Alerts
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Receive notifications about new investment opportunities.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
