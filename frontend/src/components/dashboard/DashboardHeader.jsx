import { Link } from "react-router-dom";

export default function DashboardHeader() {
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

  const canAddProperty = Boolean(user);

  return (
    <div className="mb-5 rounded-2xl bg-gradient-to-r from-green-600 to-green-500 p-4 text-white shadow-lg sm:mb-8 sm:rounded-3xl sm:p-6 md:p-8">
      <div className="flex flex-col gap-4 sm:gap-6 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold leading-tight sm:text-3xl md:text-4xl">
            My Properties
          </h1>

          <p className="mt-3 text-sm leading-6 text-green-100 sm:text-base lg:text-lg">
            Manage, update, and monitor all your property listings from one place.
          </p>
        </div>

        {canAddProperty && (
          <Link
            to="/add-property"
            className="inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-white px-5 py-3 text-sm font-bold text-green-700 transition hover:bg-gray-100 sm:w-auto sm:px-6 sm:text-base"
          >
            + Add Property
          </Link>
        )}
      </div>
    </div>
  );
}
