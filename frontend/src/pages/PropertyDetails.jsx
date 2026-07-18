import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

export default function PropertyDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProperty();
  }, []);

  async function fetchProperty() {
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/properties/${id}`
      );

      const data = await res.json();

      setProperty(data.property || data);
    } catch (err) {
      console.error(err);
    }

    setLoading(false);
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-xl font-bold">
        Loading property...
      </div>
    );
  }

  if (!property) {
    return (
      <div className="flex min-h-screen items-center justify-center text-xl font-bold">
        Property not found.
      </div>
    );
  }

  function contactSeller() {
    if (property.owner_phone) {
      window.location.href = `tel:${property.owner_phone}`;
      return;
    }

    if (property.owner_email) {
      window.location.href = `mailto:${property.owner_email}`;
      return;
    }

    alert("Seller contact information is unavailable.");
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8">

      <button
        onClick={() => navigate(-1)}
        className="mb-6 rounded-lg bg-green-600 px-4 py-2 font-semibold text-white"
      >
        ← Back
      </button>

      <div className="overflow-hidden rounded-3xl bg-white shadow-xl">

        <img
          src="/src/assets/images/property.jpg"
          alt={property.title}
          className="h-64 w-full object-cover sm:h-80 lg:h-96"
        />

        <div className="p-5 sm:p-8">

          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">

            <div className="min-w-0">
              <h1 className="break-words text-3xl font-bold sm:text-4xl">
                {property.title}
              </h1>

              <p className="mt-3 text-gray-500">
                📍 {property.city}, {property.country}
              </p>
            </div>

            <div className="rounded-xl bg-green-600 p-6 text-center text-white">
              <p>Price</p>

              <h2 className="text-3xl font-bold">
                {property.currency} {property.price}
              </h2>
            </div>

          </div>

          <div className="mt-10 grid grid-cols-2 gap-4 lg:grid-cols-4">

            <div className="rounded-xl border p-4 text-center">
              <h3 className="text-2xl font-bold">
                {property.bedrooms || 0}
              </h3>
              Bedrooms
            </div>

            <div className="rounded-xl border p-4 text-center">
              <h3 className="text-2xl font-bold">
                {property.bathrooms || 0}
              </h3>
              Bathrooms
            </div>

            <div className="rounded-xl border p-4 text-center">
              <h3 className="text-lg font-bold">
                {property.property_type}
              </h3>
              Type
            </div>

            <div className="rounded-xl border p-4 text-center">
              <h3 className="text-lg font-bold">
                {property.status}
              </h3>
              Status
            </div>

          </div>

          <div className="mt-10">
            <h2 className="mb-3 text-2xl font-bold">
              Description
            </h2>

            <p className="leading-8 text-gray-600">
              {property.description}
            </p>
          </div>

          <div className="mt-10 grid gap-6 lg:grid-cols-2">

            <div className="rounded-xl border p-6">
              <h2 className="mb-3 text-xl font-bold">
                Location
              </h2>

              <p>{property.address}</p>
              <p>{property.city}</p>
              <p>{property.country}</p>
            </div>

            <div className="rounded-xl border p-6">

              <h2 className="mb-4 text-xl font-bold">
                Seller Information
              </h2>

              <p>
                <strong>Name:</strong>{" "}
                {property.owner_name || "Not Available"}
              </p>

              <p>
                <strong>Phone:</strong>{" "}
                {property.owner_phone || "Not Available"}
              </p>

              <p>
                <strong>Email:</strong>{" "}
                {property.owner_email || "Not Available"}
              </p>

              <button
                onClick={contactSeller}
                className="mt-6 w-full rounded-xl bg-green-600 p-4 font-bold text-white hover:bg-green-700"
              >
                Contact Seller
              </button>

            </div>

          </div>

        </div>

      </div>

    </div>
  );
}
