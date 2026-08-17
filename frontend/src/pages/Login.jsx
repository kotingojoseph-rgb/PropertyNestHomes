import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

export default function Login() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [requiresTwoFactor, setRequiresTwoFactor] = useState(false);
  const [challengeToken, setChallengeToken] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleLogin = async (e) => {
    e.preventDefault();

    setLoading(true);

    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/auth/login`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
        }
      );

      const data = await res.json();

      console.log("Login status:", res.status);
      console.log("Login response:", data);

      if (!res.ok) {
        alert(data.message || data.error || "Login failed.");
        return;
      }

      // 2FA is enabled for this account.
      if (data.requiresTwoFactor) {
        setChallengeToken(data.challengeToken);
        setRequiresTwoFactor(true);
        setOtp("");
        return;
      }

      // Normal login without 2FA.
      if (data.token) {
        localStorage.setItem("token", data.token);

        if (data.user) {
          localStorage.setItem("user", JSON.stringify(data.user));
        }

        alert("Login successful!");
        navigate("/dashboard");
      }
    } catch (err) {
      console.error("Login error:", err);
      alert("Unable to connect to the server.");
    } finally {
      setLoading(false);
    }
  };

  const handleTwoFactorVerification = async (e) => {
    e.preventDefault();

    const code = otp.trim();

    if (!/^\d{6}$/.test(code)) {
      alert("Enter the 6-digit code from your authenticator app.");
      return;
    }

    if (!challengeToken) {
      alert("Your 2FA session has expired. Please log in again.");
      setRequiresTwoFactor(false);
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/2fa/login-verify`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            challengeToken,
            token: code,
          }),
        }
      );

      const data = await res.json();

      console.log("2FA status:", res.status);
      console.log("2FA response:", data);

      if (!res.ok) {
        alert(
          data.message ||
            data.error ||
            "Invalid authenticator code."
        );
        return;
      }

      if (!data.token) {
        alert("Authentication completed but no access token was returned.");
        return;
      }

      localStorage.setItem("token", data.token);

      if (data.user) {
        localStorage.setItem("user", JSON.stringify(data.user));
      }

      alert("Login successful!");

      navigate("/dashboard");
    } catch (err) {
      console.error("2FA verification error:", err);
      alert("Unable to verify the authenticator code.");
    } finally {
      setLoading(false);
    }
  };

  const backToLogin = () => {
    setRequiresTwoFactor(false);
    setChallengeToken("");
    setOtp("");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-6">
        {!requiresTwoFactor ? (
          <>
            <div className="mb-6 text-center">
              <h1 className="text-2xl font-bold text-gray-900">
                Login
              </h1>

              <p className="text-gray-500 mt-2">
                Sign in to your PropertyNestHomes account
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700"
                >
                  Email
                </label>

                <input
                  id="email"
                  type="email"
                  name="email"
                  placeholder="Enter email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full border rounded-lg p-3 mt-1"
                  autoComplete="email"
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-700"
                >
                  Password
                </label>

                <div className="relative mt-1">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    name="password"
                    placeholder="Enter password"
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full border rounded-lg p-3 pr-20"
                    autoComplete="current-password"
                    required
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowPassword(!showPassword)
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-600 hover:text-gray-900"
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </div>

              <div className="text-right">
              <Link
  to="/forgot-password"
  className="text-sm text-green-600 hover:text-green-700 font-medium"
>
  Forgot Password?
</Link>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-green-600 text-white rounded-lg p-3 hover:bg-green-700 disabled:opacity-60"
              >
                {loading ? "Signing in..." : "Login"}
              </button>
            </form>
          </>
        ) : (
          <>
            <div className="mb-6 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-green-700 text-2xl">
                🔐
              </div>

              <h1 className="text-2xl font-bold text-gray-900">
                Two-factor authentication
              </h1>

              <p className="text-gray-500 mt-2">
                Open your authenticator app and enter the
                current 6-digit code.
              </p>
            </div>

            <form
              onSubmit={handleTwoFactorVerification}
              className="space-y-5"
            >
              <div>
                <label
                  htmlFor="otp"
                  className="block text-sm font-medium text-gray-700"
                >
                  Authenticator code
                </label>

                <input
                  id="otp"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  placeholder="000000"
                  value={otp}
                  onChange={(e) =>
                    setOtp(
                      e.target.value
                        .replace(/\D/g, "")
                        .slice(0, 6)
                    )
                  }
                  className="w-full border rounded-lg p-4 mt-1 text-center text-2xl tracking-[0.5em] font-semibold"
                  autoFocus
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading || otp.length !== 6}
                className="w-full bg-green-600 text-white rounded-lg p-3 hover:bg-green-700 disabled:opacity-60"
              >
                {loading ? "Verifying..." : "Verify & Login"}
              </button>

              <button
                type="button"
                onClick={backToLogin}
                disabled={loading}
                className="w-full border border-gray-300 text-gray-700 rounded-lg p-3 hover:bg-gray-50 disabled:opacity-60"
              >
                Back to login
              </button>
            </form>

            <p className="text-xs text-gray-500 text-center mt-5">
              Your authenticator app generates a new code
              approximately every 30 seconds.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
