import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

export default function InvestorDashboard() {
  const [properties, setProperties] = useState([]);
  const [investments, setInvestments] = useState([]);
  const [summary, setSummary] = useState({
    active_investments: 0,
    pending_investments: 0,
    rejected_investments: 0,
    cancelled_investments: 0,
    total_invested: 0,
    total_pending: 0,
  });

  const [loading, setLoading] = useState(true);
  const [portfolioLoading, setPortfolioLoading] = useState(true);
  const [error, setError] = useState("");
  const [payingInvestmentId, setPayingInvestmentId] = useState(null);

  useEffect(() => {
    loadDashboard();
    handlePaymentReturn();
  }, []);

  async function loadDashboard() {
    const token = localStorage.getItem("token");

    if (!token) {
      setError("Please log in to access your investment dashboard.");
      setLoading(false);
      setPortfolioLoading(false);
      return;
    }

    await Promise.all([
      loadInvestmentOpportunities(),
      loadPortfolio(token),
    ]);
  }

  async function loadInvestmentOpportunities() {
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/properties`
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Unable to load properties.");
      }

      if (Array.isArray(data)) {
        setProperties(data);
      } else if (Array.isArray(data?.properties)) {
        setProperties(data.properties);
      } else {
        setProperties([]);
      }
    } catch (error) {
      console.error(
        "Unable to load investment opportunities:",
        error
      );
      setProperties([]);
    } finally {
      setLoading(false);
    }
  }

  async function loadPortfolio(token) {
    try {
      setPortfolioLoading(true);
      setError("");

      const headers = {
        Authorization: `Bearer ${token}`,
      };

      const [summaryRes, investmentsRes] = await Promise.all([
        fetch(
          `${import.meta.env.VITE_API_URL}/api/investments/summary`,
          { headers }
        ),
        fetch(
          `${import.meta.env.VITE_API_URL}/api/investments/my-investments`,
          { headers }
        ),
      ]);

      const summaryData = await summaryRes.json();
      const investmentsData = await investmentsRes.json();

      if (!summaryRes.ok) {
        throw new Error(
          summaryData?.error || "Unable to load investment summary."
        );
      }

      if (!investmentsRes.ok) {
        throw new Error(
          investmentsData?.error || "Unable to load investments."
        );
      }

      setSummary({
        active_investments:
          Number(summaryData?.active_investments) || 0,
        pending_investments:
          Number(summaryData?.pending_investments) || 0,
        rejected_investments:
          Number(summaryData?.rejected_investments) || 0,
        cancelled_investments:
          Number(summaryData?.cancelled_investments) || 0,
        total_invested:
          Number(summaryData?.total_invested) || 0,
        total_pending:
          Number(summaryData?.total_pending) || 0,
      });

      setInvestments(
        Array.isArray(investmentsData) ? investmentsData : []
      );
    } catch (error) {
      console.error("Unable to load investment portfolio:", error);

      setSummary({
        active_investments: 0,
        pending_investments: 0,
        rejected_investments: 0,
        cancelled_investments: 0,
        total_invested: 0,
        total_pending: 0,
      });

      setInvestments([]);

      setError(
        error.message || "Unable to load investment portfolio."
      );
    } finally {
      setPortfolioLoading(false);
    }
  }

  async function cancelInvestment(id) {
    if (!window.confirm("Cancel this investment request?")) {
      return;
    }

    const token = localStorage.getItem("token");

    if (!token) {
      setError("Your session has expired. Please log in again.");
      return;
    }

    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/investments/${id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          data?.error || "Unable to cancel investment request."
        );
      }

      await loadPortfolio(token);
    } catch (error) {
      console.error("Unable to cancel investment:", error);

      setError(
        error.message || "Unable to cancel investment request."
      );
    }
  }


  async function payForInvestment(investment) {
    const token = localStorage.getItem("token");

    if (!token) {
      setError("Your session has expired. Please log in again.");
      return;
    }

    if (!investment?.id) {
      setError("Invalid investment selected.");
      return;
    }

    if (!["pending", "approved"].includes(
      String(investment.status || "").toLowerCase()
    )) {
      setError(
        "This investment is not available for payment."
      );
      return;
    }

    setError("");
    setPayingInvestmentId(investment.id);

    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/payments/investment/initialize`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            investment_id: investment.id,
          }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          data?.error ||
          "Unable to initialize investment payment."
        );
      }

      if (!data?.authorization_url) {
        throw new Error(
          "Paystack checkout URL was not returned."
        );
      }

      /*
       * Save the reference so the callback page can verify it.
       */
      sessionStorage.setItem(
        "propertyNestHomesPaymentReference",
        data.reference
      );

      sessionStorage.setItem(
        "propertyNestHomesInvestmentId",
        String(investment.id)
      );

      /*
       * Send investor to Paystack checkout.
       */
      window.location.href = data.authorization_url;
    } catch (error) {
      console.error(
        "Investment payment initialization failed:",
        error
      );

      setError(
        error.message ||
        "Unable to initialize investment payment."
      );

      setPayingInvestmentId(null);
    }
  }

  async function verifyReturnedPayment(reference) {
    const token = localStorage.getItem("token");

    if (!token || !reference) {
      return;
    }

    try {
      setError("");

      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/payments/verify/${encodeURIComponent(
          reference
        )}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          data?.error ||
          "Unable to verify payment."
        );
      }

      /*
       * Payment was successfully verified.
       * Clear temporary checkout information.
       */
      sessionStorage.removeItem(
        "propertyNestHomesPaymentReference"
      );

      sessionStorage.removeItem(
        "propertyNestHomesInvestmentId"
      );

      /*
       * Reload the investor portfolio so the investment
       * immediately changes to completed.
       */
      await loadPortfolio(token);
    } catch (error) {
      console.error(
        "Investment payment verification failed:",
        error
      );

      setError(
        error.message ||
        "Payment was completed but could not be verified yet."
      );
    }
  }

  function handlePaymentReturn() {
    const params = new URLSearchParams(window.location.search);

    const reference =
      params.get("reference") ||
      params.get("trxref") ||
      sessionStorage.getItem(
        "propertyNestHomesPaymentReference"
      );

    if (!reference) {
      return;
    }

    /*
     * Only attempt verification when Paystack has returned
     * a transaction reference.
     */
    verifyReturnedPayment(reference);

    /*
     * Remove checkout query parameters from the URL
     * without reloading the page.
     */
    window.history.replaceState(
      {},
      document.title,
      window.location.pathname
    );
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
      property.cover_image ||
      property.image_url ||
      property.image ||
      property.photo_url ||
      property.images?.[0] ||
      "/property.jpg"
    );
  }

  function formatMoney(amount, currency = "NGN") {
    const numericAmount = Number(amount);

    if (!Number.isFinite(numericAmount)) {
      return "—";
    }

    try {
      return new Intl.NumberFormat("en-NG", {
        style: "currency",
        currency,
        maximumFractionDigits: 2,
      }).format(numericAmount);
    } catch {
      return `${currency} ${numericAmount.toLocaleString()}`;
    }
  }

  function getPropertyPrice(property) {
    const price = property.price;

    if (price === undefined || price === null || price === "") {
      return "Price available on request";
    }

    return formatMoney(price, property.currency || "NGN");
  }

  function getStatusClasses(status) {
    switch (String(status || "").toLowerCase()) {
      case "approved":
      case "completed":
        return "bg-green-100 text-green-700";

      case "pending":
        return "bg-yellow-100 text-yellow-700";

      case "rejected":
        return "bg-red-100 text-red-700";

      case "cancelled":
        return "bg-gray-100 text-gray-600";

      default:
        return "bg-gray-100 text-gray-600";
    }
  }

  return (
    <div className="mx-auto max-w-7xl p-6 md:p-8">
      <div className="mb-8 rounded-2xl bg-gradient-to-r from-green-700 to-green-500 p-6 text-white shadow-lg">
        <p className="text-sm font-medium uppercase tracking-wide text-green-100">
          Investment Dashboard
        </p>

        <h1 className="mt-2 text-3xl font-bold md:text-4xl">
          Discover your next real estate opportunity
        </h1>

        <p className="mt-3 max-w-2xl text-green-50">
          Explore verified properties, submit investment requests,
          and track your investment portfolio.
        </p>
      </div>

      {error && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-2xl bg-white p-6 shadow">
          <div className="text-sm text-gray-500">
            Available Opportunities
          </div>

          <div className="mt-2 text-3xl font-bold text-gray-900">
            {loading ? "..." : properties.length}
          </div>

          <p className="mt-1 text-sm text-gray-500">
            Verified properties
          </p>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow">
          <div className="text-sm text-gray-500">
            Active Investments
          </div>

          <div className="mt-2 text-3xl font-bold text-gray-900">
            {portfolioLoading
              ? "..."
              : summary.active_investments}
          </div>

          <p className="mt-1 text-sm text-gray-500">
            Approved or completed
          </p>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow">
          <div className="text-sm text-gray-500">
            Total Invested
          </div>

          <div className="mt-2 text-3xl font-bold text-green-700">
            {portfolioLoading
              ? "..."
              : formatMoney(summary.total_invested)}
          </div>

          <p className="mt-1 text-sm text-gray-500">
            Approved/completed investments
          </p>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow">
          <div className="text-sm text-gray-500">
            Pending Investment
          </div>

          <div className="mt-2 text-3xl font-bold text-yellow-600">
            {portfolioLoading
              ? "..."
              : formatMoney(summary.total_pending)}
          </div>

          <p className="mt-1 text-sm text-gray-500">
            Awaiting approval
          </p>
        </div>
      </div>

      <div className="mt-10">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              My Investments
            </h2>

            <p className="mt-1 text-gray-500">
              Track your investment requests and their status.
            </p>
          </div>
        </div>

        {portfolioLoading ? (
          <div className="rounded-2xl bg-white p-10 text-center shadow">
            <p className="text-gray-500">
              Loading your investment portfolio...
            </p>
          </div>
        ) : investments.length === 0 ? (
          <div className="rounded-2xl bg-white p-10 text-center shadow">
            <div className="text-4xl">📊</div>

            <h3 className="mt-3 text-xl font-bold text-gray-900">
              No investments yet
            </h3>

            <p className="mt-2 text-gray-500">
              Browse verified properties below and submit your
              first investment request.
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {investments.map((investment) => (
              <div
                key={investment.id}
                className="rounded-2xl bg-white p-5 shadow"
              >
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <Link
                      to={`/property/${investment.property_id}`}
                      className="text-lg font-bold text-gray-900 hover:text-green-600"
                    >
                      {investment.property_title ||
                        "Investment Property"}
                    </Link>

                    <p className="mt-1 text-sm text-gray-500">
                      📍{" "}
                      {[
                        investment.city,
                        investment.state_province,
                        investment.country,
                      ]
                        .filter(Boolean)
                        .join(", ") || "Location unavailable"}
                    </p>

                    <p className="mt-2 text-sm text-gray-500">
                      Investment amount
                    </p>

                    <p className="text-xl font-bold text-green-700">
                      {formatMoney(
                        investment.amount,
                        investment.currency || "NGN"
                      )}
                    </p>
                  </div>

                  <div className="flex flex-col items-start gap-3 md:items-end">
                    <span
                      className={`rounded-full px-3 py-1 text-sm font-semibold capitalize ${getStatusClasses(
                        investment.status
                      )}`}
                    >
                      {investment.status}
                    </span>

                    {(investment.status === "pending" ||
                      investment.status === "approved") && (
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            payForInvestment(investment)
                          }
                          disabled={
                            payingInvestmentId === investment.id
                          }
                          className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {payingInvestmentId === investment.id
                            ? "Opening Paystack..."
                            : "Pay Now"}
                        </button>

                        {investment.status === "pending" && (
                          <button
                            type="button"
                            onClick={() =>
                              cancelInvestment(investment.id)
                            }
                            className="rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
                          >
                            Cancel Request
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-10">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Investment Opportunities
            </h2>

            <p className="mt-1 text-gray-500">
              Browse properties currently available on
              PropertyNestHomes.
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
              New verified properties will appear here when they
              become available.
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
          Investment Features
        </h2>

        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <div className="rounded-xl bg-white p-4">
            <div className="text-2xl">📊</div>
            <h3 className="mt-2 font-bold">
              Portfolio Tracking
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Track properties you invest in and monitor investment
              requests.
            </p>
          </div>

          <div className="rounded-xl bg-white p-4">
            <div className="text-2xl">💰</div>
            <h3 className="mt-2 font-bold">
              Investment Returns
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Return calculations can be added once investment
              performance data is available.
            </p>
          </div>

          <div className="rounded-xl bg-white p-4">
            <div className="text-2xl">🔔</div>
            <h3 className="mt-2 font-bold">
              Opportunity Alerts
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Receive notifications about new investment
              opportunities.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
