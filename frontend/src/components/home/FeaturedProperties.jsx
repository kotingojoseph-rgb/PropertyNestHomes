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

        const featured = data
          .filter(
            (property) =>
              property.verification_status === "verified"
          )
          .slice(0, 6);

        setProperties(featured);

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

          <h2 className="text-3xl sm:text-5xl font-bold">
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

            {properties.map((property)=> (

              <PropertyCard
                key={property.id}

                id={property.id}

                image={
  property.cover_image ||
  "/hero-house.jpg"
}
                  

                title={property.title}

                location={
                  `${property.city || property.location}, ${property.country}`
                }

                price={
                  `${property.currency} ${Number(property.price).toLocaleString()}`
                }

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
            className="inline-block rounded-xl bg-green-600 px-6 py-3 font-bold text-white hover:bg-green-700"
          >
            View All Properties →
          </Link>

        </div>

      </div>

    </section>
  );
}
