import { useState } from "react";
import { Link } from "react-router-dom";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    setMessage("");
    setError("");

    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail) {
      setError("Please enter your email address.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/password/forgot-password`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: normalizedEmail,
          }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        setError(
          data.error ||
            "We could not process your request. Please try again."
        );
        return;
      }

      setMessage(
        data.message ||
          "If this email exists, a password reset link has been sent."
      );
    } catch (err) {
      console.error("Forgot password error:", err);

      setError(
        "Unable to connect to PropertyNestHomes. Please check your internet connection and try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-10">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-lg p-7">
          <div className="text-center mb-7">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-green-700 text-2xl">
              🔐
            </div>

            <h1 className="text-2xl font-bold text-gray-900">
              Forgot Password?
            </h1>

            <p className="text-gray-500 mt-2 leading-relaxed">
              Enter the email address associated with your
              PropertyNestHomes account and we'll send you a secure
              password reset link.
            </p>
          </div>

          {message && (
            <div
              className="mb-5 rounded-lg bg-green-50 border border-green-200 p-4 text-sm text-green-800"
              role="status"
            >
              {message}
            </div>
          )}

          {error && (
            <div
              className="mb-5 rounded-lg bg-red-50 border border-red-200 p-4 text-sm text-red-700"
              role="alert"
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label
                htmlFor="forgot-email"
                className="block text-sm font-medium text-gray-700"
              >
                Email Address
              </label>

              <input
                id="forgot-email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError("");
                }}
                className="w-full border border-gray-300 rounded-lg p-3 mt-1 outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                autoComplete="email"
                autoCapitalize="none"
                spellCheck="false"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-600 text-white rounded-lg p-3 font-medium hover:bg-green-700 transition disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? "Sending Reset Link..." : "Send Reset Link"}
            </button>
          </form>

          <div className="text-center mt-6">
            <Link
              to="/login"
              className="text-green-600 hover:text-green-700 font-medium"
            >
              ← Back to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
