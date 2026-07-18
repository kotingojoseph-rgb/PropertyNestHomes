import { Link } from "react-router-dom";

export default function EmptyDashboard() {
  return (
    <div className="rounded-3xl border bg-white p-12 text-center shadow-md">

      <div className="text-6xl mb-6">
        🏡
      </div>


      <h2 className="text-3xl font-bold text-gray-900">
        No Properties Yet
      </h2>


      <p className="mt-4 text-lg text-gray-500">
        Start building your portfolio by adding your first property listing.
      </p>


      <Link
        to="/add-property"
        className="mt-8 inline-block rounded-xl bg-green-600 px-8 py-4 font-bold text-white hover:bg-green-700 transition"
      >
        + Add Your First Property
      </Link>


    </div>
  );
}
