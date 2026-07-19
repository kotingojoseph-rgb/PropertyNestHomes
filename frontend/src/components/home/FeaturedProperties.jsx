import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import PropertyCard from "./PropertyCard";
import { getProperties } from "@/api/propertyApi";

export default function FeaturedProperties() {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadProperties() {
      try {
        const data = await getProperties();
        setProperties(data.slice(0, 6));
      } catch (err) {
        console.error(err);
        setError("Unable to load featured properties.");
      } finally {
        setLoading(false);
      }
    }

    loadProperties();
  }, []);

  if (loading) {
    return (
      <section className="bg-gray-100 py-14 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 text-center">
          <h2 className="text-3xl font-bold">Featured Properties</h2>
          <p className="mt-6 text-gray-500">Loading properties...</p>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="bg-gray-100 py-14 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 text-center">
          <h2 className="text-3xl font-bold">Featured Properties</h2>
          <p className="mt-6 text-red-600">{error}</p>
        </div>
      </section>
    );
  }

  return (
    <section className="bg-gray-100 py-14 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">

        <div className="mb-10 text-center">
          <h2 className="text-3xl sm:text-5xl font-bold text-gray-900">
            Featured Properties
          </h2>

          <p className="mx-auto mt-4 max-w-2xl text-sm sm:text-lg text-gray-600">
            Explore hand-picked luxury homes, premium apartments,
            and investment opportunities.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {properties.map((property) => (
            <PropertyCard
              key={property.id}
              id={property.id}
              image={property.image}
              title={property.title}
              location={`${property.city}, ${property.country}`}
              price={`${property.currency} ${Number(property.price).toLocaleString()}`}
              bedrooms={property.bedrooms}
              bathrooms={property.bathrooms}
              size={property.size}
              status={property.status}
            />
          ))}
        </div>

        <div className="mt-10 text-center">
          <Link
            to="/buy"
            className="inline-block rounded-xl bg-green-600 px-6 py-3 font-bold text-white hover:bg-green-700 transition"
          >
            View All Properties →
          </Link>
        </div>

      </div>
    </section>
  );
}
