import { Link } from "react-router-dom";

export default function EmptyDashboard() {
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
    <div className="min-w-0 rounded-3xl border bg-white p-6 text-center shadow-md sm:p-12">
      <div className="mb-6 text-5xl sm:text-6xl">
        🏡
      </div>

      <h2 className="break-words text-2xl font-bold text-gray-900 sm:text-3xl">
        No Properties Yet
      </h2>

      <p className="mt-4 break-words text-base text-gray-500 sm:text-lg">
        {canAddProperty
          ? "Start building your portfolio by adding your first property listing."
          : "You don't have any property listings yet."}
      </p>

      {canAddProperty && (
        <Link
          to="/add-property"
          className="mt-8 inline-block rounded-xl bg-green-600 px-8 py-4 font-bold text-white hover:bg-green-700 transition"
        >
          + Add Your First Property
        </Link>
      )}
    </div>
  );
}
