import { useEffect, useState } from "react";

export default function AdminInvestments() {
  const [investments, setInvestments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [workingId, setWorkingId] = useState(null);

  async function loadInvestments() {
    try {
      setLoading(true);
      setError("");

      const token = localStorage.getItem("token");

      if (!token) {
        throw new Error("Please log in as an administrator.");
      }

      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/admin/investments`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          data?.error || "Unable to load investments."
        );
      }

      setInvestments(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Admin investments error:", error);
      setError(
        error.message || "Unable to load investments."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadInvestments();
  }, []);

  async function updateInvestment(id, action) {
    let reason = "";

    if (action === "reject") {
      reason = window.prompt(
        "Reason for rejecting this investment? (optional)"
      ) || "";
    }

    if (
      !window.confirm(
        action === "approve"
          ? "Approve this investment request?"
          : "Reject this investment request?"
      )
    ) {
      return;
    }

    try {
      setWorkingId(id);
      setError("");

      const token = localStorage.getItem("token");

      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/admin/investments/${id}/${action}`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body:
            action === "reject"
              ? JSON.stringify({ reason })
              : undefined,
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          data?.error ||
            `Unable to ${action} investment.`
        );
      }

      await loadInvestments();
    } catch (error) {
      console.error(
        `Unable to ${action} investment:`,
        error
      );

      setError(
        error.message ||
          `Unable to ${action} investment.`
      );
    } finally {
      setWorkingId(null);
    }
  }

  function formatMoney(amount, currency = "NGN") {
    const numericAmount = Number(amount);

    if (!Number.isFinite(numericAmount)) {
      return `${currency} 0.00`;
    }

    try {
      return new Intl.NumberFormat(undefined, {
        style: "currency",
        currency,
        maximumFractionDigits: 2,
      }).format(numericAmount);
    } catch {
      return `${currency} ${numericAmount.toFixed(2)}`;
    }
  }

  function statusClasses(status) {
    switch (String(status || "").toLowerCase()) {
      case "completed":
        return "bg-green-100 text-green-700";

      case "approved":
        return "bg-blue-100 text-blue-700";

      case "pending":
        return "bg-yellow-100 text-yellow-700";

      case "rejected":
        return "bg-red-100 text-red-700";

      case "cancelled":
        return "bg-gray-100 text-gray-700";

      default:
        return "bg-gray-100 text-gray-700";
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl p-8">
        <div className="rounded-2xl bg-white p-10 text-center shadow">
          <p className="text-gray-500">
            Loading investment requests...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl p-6 md:p-8">
      <div className="mb-8 rounded-2xl bg-gradient-to-r from-green-800 to-green-500 p-6 text-white shadow-lg md:p-8">
        <p className="text-sm font-semibold uppercase tracking-wide text-green-100">
          Admin
        </p>

        <h1 className="mt-2 text-3xl font-bold md:text-4xl">
          Investment Management
        </h1>

        <p className="mt-3 max-w-3xl text-green-50">
          Review investment requests from PropertyNestHomes
          users, approve or reject pending requests, and
          monitor payment status.
        </p>
      </div>

      {error && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl bg-white p-5 shadow">
          <p className="text-sm text-gray-500">
            Total Requests
          </p>

          <p className="mt-2 text-3xl font-bold">
            {investments.length}
          </p>
        </div>

        <div className="rounded-2xl bg-white p-5 shadow">
          <p className="text-sm text-gray-500">
            Pending
          </p>

          <p className="mt-2 text-3xl font-bold text-yellow-600">
            {
              investments.filter(
                (item) => item.status === "pending"
              ).length
            }
          </p>
        </div>

        <div className="rounded-2xl bg-white p-5 shadow">
          <p className="text-sm text-gray-500">
            Approved
          </p>

          <p className="mt-2 text-3xl font-bold text-blue-600">
            {
              investments.filter(
                (item) => item.status === "approved"
              ).length
            }
          </p>
        </div>

        <div className="rounded-2xl bg-white p-5 shadow">
          <p className="text-sm text-gray-500">
            Completed
          </p>

          <p className="mt-2 text-3xl font-bold text-green-600">
            {
              investments.filter(
                (item) => item.status === "completed"
              ).length
            }
          </p>
        </div>
      </div>

      {investments.length === 0 ? (
        <div className="rounded-2xl bg-white p-10 text-center shadow">
          <div className="text-4xl">📊</div>

          <h2 className="mt-3 text-xl font-bold text-gray-900">
            No investment requests yet
          </h2>

          <p className="mt-2 text-gray-500">
            When users submit investment requests,
            they will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {investments.map((investment) => (
            <div
              key={investment.id}
              className="rounded-2xl bg-white p-5 shadow"
            >
              <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-3">
                    <h2 className="text-lg font-bold text-gray-900">
                      {investment.property_title ||
                        "Investment Property"}
                    </h2>

                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${statusClasses(
                        investment.status
                      )}`}
                    >
                      {investment.status}
                    </span>
                  </div>

                  <p className="mt-2 text-sm text-gray-500">
                    Investment #{investment.id}
                  </p>

                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <div>
                      <p className="text-xs uppercase tracking-wide text-gray-400">
                        Investor
                      </p>

                      <p className="font-semibold text-gray-900">
                        {investment.investor_name ||
                          "Unknown user"}
                      </p>

                      <p className="text-sm text-gray-500">
                        {investment.investor_email || "No email"}
                      </p>

                      <p className="mt-1 text-xs capitalize text-gray-400">
                        Role:{" "}
                        {investment.investor_role ||
                          "unknown"}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs uppercase tracking-wide text-gray-400">
                        Investment Amount
                      </p>

                      <p className="text-xl font-bold text-green-700">
                        {formatMoney(
                          investment.amount,
                          investment.settlement_currency ||
                            investment.currency ||
                            "NGN"
                        )}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs uppercase tracking-wide text-gray-400">
                        Property
                      </p>

                      <p className="font-medium text-gray-900">
                        {investment.city ||
                        investment.state_province ||
                        investment.country
                          ? [
                              investment.city,
                              investment.state_province,
                              investment.country,
                            ]
                              .filter(Boolean)
                              .join(", ")
                          : "Location unavailable"}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs uppercase tracking-wide text-gray-400">
                        Payment Reference
                      </p>

                      <p className="break-all text-sm font-medium text-gray-700">
                        {investment.payment_reference ||
                          "Not initialized"}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs uppercase tracking-wide text-gray-400">
                        Submitted
                      </p>

                      <p className="text-sm text-gray-700">
                        {investment.created_at
                          ? new Date(
                              investment.created_at
                            ).toLocaleString()
                          : "Unknown"}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs uppercase tracking-wide text-gray-400">
                        Property Value
                      </p>

                      <p className="text-sm text-gray-700">
                        {formatMoney(
                          investment.property_price,
                          investment.property_currency ||
                            "NGN"
                        )}
                      </p>
                    </div>
                  </div>

                  {investment.notes && (
                    <div className="mt-4 rounded-xl bg-gray-50 p-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                        Notes
                      </p>

                      <p className="mt-1 text-sm text-gray-700">
                        {investment.notes}
                      </p>
                    </div>
                  )}
                </div>

                {investment.status === "pending" && (
                  <div className="flex shrink-0 flex-col gap-2 sm:flex-row lg:flex-col">
                    <button
                      type="button"
                      disabled={workingId === investment.id}
                      onClick={() =>
                        updateInvestment(
                          investment.id,
                          "approve"
                        )
                      }
                      className="rounded-lg bg-green-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {workingId === investment.id
                        ? "Working..."
                        : "Approve"}
                    </button>

                    <button
                      type="button"
                      disabled={workingId === investment.id}
                      onClick={() =>
                        updateInvestment(
                          investment.id,
                          "reject"
                        )
                      }
                      className="rounded-lg border border-red-200 px-5 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Reject
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
