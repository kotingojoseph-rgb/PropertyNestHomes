import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import PropertyCard from "./PropertyCard";
import { getProperties } from "@/api/propertyApi";

import luxuryHome from "@/assets/images/properties/luxury-home.jpg";
import modernVilla from "@/assets/images/properties/modern-villa.jpg";
import modernHouse from "@/assets/images/properties/modern-house.jpg";
import apartment from "@/assets/images/properties/apartment.jpg";
import penthouse from "@/assets/images/properties/penthouse.jpg";
import interior from "@/assets/images/properties/interior.jpg";

const fallbackImages = [
  luxuryHome,
  modernVilla,
  modernHouse,
  apartment,
  penthouse,
  interior,
];

export default function FeaturedProperties() {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadProperties() {
      try {
        const data = await getProperties();

        console.log("Featured properties API:", data);
        console.log("Featured count:", data.length);

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
      <section className="bg-gray-100 py-14">
        <div className="text-center">
          <h2 className="text-3xl font-bold">
            Featured Properties
          </h2>

          <p className="mt-4 text-gray-500">
            Loading properties...
          </p>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="bg-gray-100 py-14">
        <div className="text-center text-red-600">
          {error}
        </div>
      </section>
    );
  }

  return (
    <section className="bg-gray-100 py-14 sm:py-20">
      <div className="mx-auto max-w-7xl px-4">
        <div className="mb-10 text-center">
          <p className="mb-2 text-sm font-bold uppercase tracking-widest text-green-600">
            Discover Your Next Home
          </p>

          <h2 className="text-3xl font-extrabold sm:text-5xl">
            Featured Properties
          </h2>

          <p className="mt-4 text-gray-600">
            Explore verified homes and investment opportunities.
          </p>
        </div>

        {properties.length === 0 ? (
          <p className="text-center text-gray-500">
            No featured properties available.
          </p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {properties.map((property, index) => (
              <PropertyCard
                key={property.id}
                id={property.id}
                image={property.cover_image || fallbackImages[index % fallbackImages.length]}
                title={property.title}
                location={`${property.city || property.location || "Nigeria"}, ${property.country || ""}`}
                price={`${property.currency || "NGN"} ${Number(
                  property.price || 0
                ).toLocaleString()}`}
                bedrooms={property.bedrooms}
                bathrooms={property.bathrooms}
                size={property.area}
                status={property.status}
              />
            ))}
          </div>
        )}

        <div className="mt-10 text-center">
          <Link
            to="/buy"
            className="
              inline-flex
              items-center
              rounded-xl
              bg-green-600
              px-7
              py-3
              font-bold
              text-white
              shadow-lg
              transition
              hover:-translate-y-0.5
              hover:bg-green-700
            "
          >
            View All Properties →
          </Link>
        </div>
      </div>
    </section>
  );
}
