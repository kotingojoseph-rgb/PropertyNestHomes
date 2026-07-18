import { Link } from "react-router-dom";

export default function DashboardHeader() {
  return (
    <div className="mb-10 rounded-3xl bg-gradient-to-r from-green-600 to-green-500 p-8 text-white shadow-lg">

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">

        <div>

          <h1 className="text-4xl font-bold">
            My Properties
          </h1>

          <p className="mt-3 text-green-100 text-lg">
            Manage, update, and monitor all your property listings from one place.
          </p>

        </div>


        <Link
          to="/add-property"
          className="inline-flex items-center justify-center rounded-xl bg-white px-6 py-3 font-bold text-green-700 hover:bg-gray-100 transition"
        >
          + Add Property
        </Link>


      </div>

    </div>
  );
}
