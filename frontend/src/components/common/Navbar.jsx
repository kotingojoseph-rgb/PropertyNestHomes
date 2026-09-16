import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const token = localStorage.getItem("token");

  let currentUser = null;

  try {
    const storedUser = localStorage.getItem("user");
    currentUser = storedUser ? JSON.parse(storedUser) : null;
  } catch {
    currentUser = null;
  }

  const isAdmin =
    String(currentUser?.role || "")
      .trim()
      .toLowerCase() === "admin";

  const links = [
    { name: "Home", path: "/" },
    { name: "Buy", path: "/buy" },
    { name: "Chat", path: "/chat" },
    { name: "Invest", path: "/investments" },
    { name: "About", path: "/about" },
    { name: "Contact", path: "/contact" },
  ];

  function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setMenuOpen(false);
    navigate("/");
  }

  function closeMenu() {
    setMenuOpen(false);
  }

  function isActive(path) {
    if (path === "/") {
      return location.pathname === "/";
    }

    return location.pathname === path;
  }

  const desktopLinkClass = (path) =>
    `whitespace-nowrap transition ${
      isActive(path)
        ? "font-semibold text-green-700"
        : "text-gray-700 hover:text-green-600"
    }`;

  const mobileLinkClass = (path) =>
    `flex min-h-11 w-full items-center rounded-xl px-4 py-3 text-sm font-medium transition ${
      isActive(path)
        ? "bg-green-50 text-green-700"
        : "text-gray-700 active:bg-gray-100"
    }`;

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-gray-200 bg-white/95 shadow-sm backdrop-blur">
      <div className="mx-auto flex min-h-16 w-full max-w-7xl min-w-0 items-center justify-between gap-2 px-3 sm:px-4 lg:px-6">
        {/* Brand */}
        <Link
          to="/"
          onClick={closeMenu}
          className="flex shrink-0 items-center text-green-700"
          aria-label="PropertyNestHomes home"
        >
          <span className="text-xl leading-none sm:text-2xl">
            🏡
          </span>

          <span className="ml-2 hidden whitespace-nowrap font-extrabold text-lg lg:inline">
            PropertyNestHomes
          </span>

          <span className="ml-2 inline font-extrabold text-lg sm:hidden">
            PNH
          </span>
        </Link>

        {/* Desktop navigation */}
        <div className="hidden min-w-0 flex-1 items-center justify-end gap-3 md:flex lg:gap-4">
          {links.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={desktopLinkClass(link.path)}
            >
              {link.name}
            </Link>
          ))}

          {token ? (
            <>
              {isAdmin && (
                <Link
                  to="/admin/investments"
                  className="min-h-11 whitespace-nowrap rounded-xl bg-purple-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-purple-700"
                >
                  Admin Investments
                </Link>
              )}

              <Link
                to="/dashboard"
                className="min-h-11 whitespace-nowrap rounded-xl bg-green-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-green-700"
              >
                Dashboard
              </Link>

              <Link
                to="/profile"
                className="flex min-h-11 items-center gap-2 whitespace-nowrap rounded-xl border border-green-600 px-3 py-2 text-sm font-semibold text-green-700 transition hover:bg-green-50"
              >
                {currentUser?.profile_image_url ? (
                  <img
                    src={currentUser.profile_image_url}
                    alt=""
                    className="h-7 w-7 rounded-full object-cover"
                    onError={(event) => {
                      event.currentTarget.style.display = "none";
                    }}
                  />
                ) : (
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-green-100 text-xs font-bold text-green-700">
                    {(currentUser?.full_name || "User")
                      .split(" ")
                      .map((part) => part[0])
                      .filter(Boolean)
                      .slice(0, 2)
                      .join("")
                      .toUpperCase()}
                  </span>
                )}
                Profile
              </Link>

              <button
                type="button"
                onClick={logout}
                className="min-h-11 whitespace-nowrap rounded-xl bg-red-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-red-700"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="whitespace-nowrap font-medium text-gray-700 transition hover:text-green-600"
              >
                Login
              </Link>

              <Link
                to="/register"
                className="min-h-11 whitespace-nowrap rounded-xl bg-green-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-green-700"
              >
                Register
              </Link>
            </>
          )}
        </div>

        {/* Mobile menu button */}
        <button
          type="button"
          onClick={() => setMenuOpen((open) => !open)}
          aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
          aria-expanded={menuOpen}
          aria-controls="mobile-navigation"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-gray-200 bg-white text-xl text-gray-800 shadow-sm transition active:scale-95 hover:bg-gray-50 md:hidden"
        >
          <span aria-hidden="true">
            {menuOpen ? "✕" : "☰"}
          </span>
        </button>
      </div>

      {/* Mobile navigation */}
      {menuOpen && (
        <div
          id="mobile-navigation"
          className="border-t border-gray-200 bg-white shadow-lg md:hidden"
        >
          <div className="mx-auto w-full max-w-7xl px-3 py-3 sm:px-4">
            <div className="space-y-1">
              {links.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={closeMenu}
                  className={mobileLinkClass(link.path)}
                >
                  {link.name}
                </Link>
              ))}
            </div>

            <div className="my-3 border-t border-gray-100" />

            {token ? (
              <div className="space-y-2">
                {isAdmin && (
                  <Link
                    to="/admin/investments"
                    onClick={closeMenu}
                    className="flex min-h-11 w-full items-center justify-center rounded-xl bg-purple-600 px-4 py-3 text-sm font-semibold text-white active:bg-purple-700"
                  >
                    Admin Investments
                  </Link>
                )}

                <Link
                  to="/dashboard"
                  onClick={closeMenu}
                  className="flex min-h-11 w-full items-center justify-center rounded-xl bg-green-600 px-4 py-3 text-sm font-semibold text-white active:bg-green-700"
                >
                  Dashboard
                </Link>

                <Link
                  to="/profile"
                  onClick={closeMenu}
                  className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-green-600 px-4 py-3 text-sm font-semibold text-green-700 active:bg-green-50"
                >
                  {currentUser?.profile_image_url ? (
                    <img
                      src={currentUser.profile_image_url}
                      alt=""
                      className="h-7 w-7 rounded-full object-cover"
                      onError={(event) => {
                        event.currentTarget.style.display = "none";
                      }}
                    />
                  ) : (
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-green-100 text-xs font-bold text-green-700">
                      {(currentUser?.full_name || "User")
                        .split(" ")
                        .map((part) => part[0])
                        .filter(Boolean)
                        .slice(0, 2)
                        .join("")
                        .toUpperCase()}
                    </span>
                  )}
                  Profile
                </Link>

                <button
                  type="button"
                  onClick={logout}
                  className="flex min-h-11 w-full items-center justify-center rounded-xl bg-red-600 px-4 py-3 text-sm font-semibold text-white active:bg-red-700"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <Link
                  to="/login"
                  onClick={closeMenu}
                  className="flex min-h-11 items-center justify-center rounded-xl border border-gray-200 px-4 py-3 text-sm font-semibold text-gray-700 active:bg-gray-50"
                >
                  Login
                </Link>

                <Link
                  to="/register"
                  onClick={closeMenu}
                  className="flex min-h-11 items-center justify-center rounded-xl bg-green-600 px-4 py-3 text-sm font-semibold text-white active:bg-green-700"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
