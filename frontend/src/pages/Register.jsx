import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const ACCOUNT_TYPES = [
  {
    value: "buyer",
    title: "Buyer",
    description: "Find and purchase your next property.",
    icon: "🏠",
  },
  {
    value: "tenant",
    title: "Tenant",
    description: "Find a home or property to rent.",
    icon: "🔑",
  },
  {
    value: "seller",
    title: "Seller",
    description: "List your property for sale.",
    icon: "🏡",
  },
  {
    value: "landlord",
    title: "Landlord",
    description: "List and manage rental properties.",
    icon: "🏢",
  },
  {
    value: "agent",
    title: "Agent",
    description: "Manage properties and clients.",
    icon: "👔",
  },
  {
    value: "investor",
    title: "Investor",
    description: "Explore and manage real estate investment opportunities.",
    icon: "📈",
  },
];

const initialForm = {
  full_name: "",
  email: "",
  password: "",
  phone: "",
  role: "buyer",
};

export default function Register() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState(initialForm);
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));

    setError("");
  };

  const handleRoleChange = (role) => {
    setFormData((previous) => ({
      ...previous,
      role,
    }));

    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    if (!formData.role) {
      setError("Please select an account type.");
      return;
    }

    if (formData.password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/auth/register`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            full_name: formData.full_name,
            email: formData.email,
            password: formData.password,
            phone: formData.phone,
            role: formData.role,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(
          data.error ||
            data.message ||
            "Registration failed."
        );
        return;
      }

      setSuccess(
        `Registration successful! Your account is registered as a ${formData.role}.`
      );

      setFormData(initialForm);

      setTimeout(() => {
        navigate("/login");
      }, 1800);
    } catch (err) {
      console.error("Registration error:", err);
      setError(
        "Unable to connect to PropertyNestHomes. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-10">
      <div className="mx-auto w-full max-w-3xl">

        <div className="mb-8 text-center">
          <h1 className="text-4xl font-extrabold tracking-tight text-gray-900">
            Create your PropertyNestHomes account
          </h1>

          <p className="mt-3 text-gray-600">
            Choose how you want to use PropertyNestHomes.
          </p>
        </div>

        <div className="rounded-3xl bg-white p-6 shadow-xl sm:p-8">

          <form onSubmit={handleSubmit} className="space-y-7">

            {/* ACCOUNT TYPE */}
            <div>
              <label className="mb-3 block text-lg font-bold text-gray-900">
                I want to register as
              </label>

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">

                {ACCOUNT_TYPES.map((account) => {
                  const selected =
                    formData.role === account.value;

                  return (
                    <button
                      key={account.value}
                      type="button"
                      onClick={() =>
                        handleRoleChange(account.value)
                      }
                      className={`rounded-2xl border-2 p-4 text-left transition ${
                        selected
                          ? "border-green-600 bg-green-50 shadow-md"
                          : "border-gray-200 bg-white hover:border-green-300 hover:bg-gray-50"
                      }`}
                    >
                      <div className="flex items-start gap-3">

                        <span className="text-3xl">
                          {account.icon}
                        </span>

                        <div>
                          <div className="font-bold text-gray-900">
                            {account.title}
                          </div>

                          <div className="mt-1 text-sm leading-5 text-gray-600">
                            {account.description}
                          </div>
                        </div>

                      </div>
                    </button>
                  );
                })}

              </div>
            </div>

            {/* PERSONAL INFORMATION */}
            <div className="grid gap-5 sm:grid-cols-2">

              <div>
                <label
                  htmlFor="full_name"
                  className="mb-2 block text-sm font-semibold text-gray-700"
                >
                  Full Name
                </label>

                <input
                  id="full_name"
                  type="text"
                  name="full_name"
                  placeholder="Your full name"
                  value={formData.full_name}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-gray-300 p-3 outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-100"
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="phone"
                  className="mb-2 block text-sm font-semibold text-gray-700"
                >
                  Phone Number
                </label>

                <input
                  id="phone"
                  type="tel"
                  name="phone"
                  placeholder="Phone number"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-gray-300 p-3 outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-100"
                  required
                />
              </div>

            </div>

            {/* EMAIL */}
            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-sm font-semibold text-gray-700"
              >
                Email Address
              </label>

              <input
                id="email"
                type="email"
                name="email"
                placeholder="you@example.com"
                value={formData.email}
                onChange={handleChange}
                className="w-full rounded-xl border border-gray-300 p-3 outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-100"
                required
              />
            </div>

            {/* PASSWORD */}
            <div>
              <label
                htmlFor="password"
                className="mb-2 block text-sm font-semibold text-gray-700"
              >
                Password
              </label>

              <div className="relative">

                <input
                  id="password"
                  type={
                    showPassword
                      ? "text"
                      : "password"
                  }
                  name="password"
                  placeholder="At least 8 characters"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-gray-300 p-3 pr-24 outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-100"
                  minLength={8}
                  required
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowPassword(
                      (previous) => !previous
                    )
                  }
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-green-700"
                >
                  {showPassword
                    ? "Hide"
                    : "Show"}
                </button>

              </div>

              <p className="mt-2 text-xs text-gray-500">
                Use at least 8 characters.
              </p>
            </div>

            {/* VERIFICATION NOTE */}
            <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4">

              <h2 className="font-bold text-gray-900">
                Verification information
              </h2>

              <p className="mt-1 text-sm text-gray-600">
                Identification information can be
                provided later when verification is
                required for property-related activities.
              </p>

            </div>

            {/* ERRORS */}
            {error && (
              <div
                role="alert"
                className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700"
              >
                {error}
              </div>
            )}

            {/* SUCCESS */}
            {success && (
              <div
                role="status"
                className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm font-medium text-green-700"
              >
                {success}
              </div>
            )}

            {/* SUBMIT */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-xl bg-green-600 p-4 font-bold text-white shadow-md transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting
                ? "Creating account..."
                : "Create Account"}
            </button>

            <p className="text-center text-sm text-gray-600">
              Already have an account?{" "}

              <Link
                to="/login"
                className="font-bold text-green-700 hover:underline"
              >
                Log in
              </Link>
            </p>

          </form>

        </div>
      </div>
    </div>
  );
}
