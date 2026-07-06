import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

export default function Dashboard() {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
  const token = localStorage.getItem("token");

  fetch(`${import.meta.env.VITE_API_URL}/api/properties/my-properties`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
    .then((res) => res.json())
    .then((data) => {
      setProperties(data);
      setLoading(false);
    })
    .catch((err) => {
      console.error(err);
      setLoading(false);
    });
}, []);

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this property?")) return;

    try {
      const token = localStorage.getItem("token");

      const res = await fetch(
  `${import.meta.env.VITE_API_URL}/api/properties/${id}`,
  {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  }
);

      const data = await res.json();

      if (!res.ok) {
        alert(data.message || data.error);
        return;
      }

      setProperties((prev) =>
        prev.filter((property) => property.id !== id)
      );

      alert("Property deleted successfully!");
    } catch (err) {
      console.error(err);
      alert("Delete failed.");
    }
  };

  if (loading) {
    return (
      <div className="p-10 text-center text-2xl font-bold">
        Loading...
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl p-10">
      <h1 className="mb-8 text-4xl font-bold">
        My Properties
      </h1>

      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
        {properties.map((property) => (
          <div
            key={property.id}
            className="overflow-hidden rounded-2xl border bg-white shadow"
          >
            <img
              src={
                property.image ||
                "https://images.unsplash.com/photo-1600585154340-be6161a56a0c"
              }
              alt={property.title}
              className="h-56 w-full object-cover"
            />

            <div className="p-6">
              <h2 className="text-2xl font-bold">
                {property.title}
              </h2>

              <p className="mt-2 text-gray-500">
                {property.city}, {property.country}
              </p>

              <p className="mt-4 text-3xl font-bold text-green-600">
                {property.currency} {property.price}
              </p>

              <div className="mt-6 flex gap-3">
                <Link
                  to={`/property/${property.id}`}
                  className="rounded-lg bg-black px-4 py-2 text-white"
                >
                  View
                </Link>

                <button className="rounded-lg bg-blue-600 px-4 py-2 text-white">
                  Edit
                </button>

                <button
                  onClick={() => handleDelete(property.id)}
                  className="rounded-lg bg-red-600 px-4 py-2 text-white"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
