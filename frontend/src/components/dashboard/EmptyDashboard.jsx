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

  const canAddProperty = ["seller", "landlord", "agent"].includes(userRole);

  return (
    <div className="rounded-3xl border bg-white p-12 text-center shadow-md">
      <div className="text-6xl mb-6">
        🏡
      </div>

      <h2 className="text-3xl font-bold text-gray-900">
        No Properties Yet
      </h2>

      <p className="mt-4 text-lg text-gray-500">
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
