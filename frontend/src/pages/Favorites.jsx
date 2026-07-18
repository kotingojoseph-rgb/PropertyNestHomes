import { useEffect, useState } from "react";
import PropertyCard from "@/components/home/PropertyCard";
import heroHouse from "@/assets/images/hero-house.jpg";
import { getProperties } from "@/api/propertyApi";

export default function Favorites() {
  const [favorites, setFavorites] = useState([]);
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);

  function loadFavorites() {
    const saved = JSON.parse(
      localStorage.getItem("favorites") || "[]"
    );

    setFavorites(saved);
  }

  useEffect(() => {
    async function loadProperties() {
      try {
        const data = await getProperties();
        setProperties(data);
        loadFavorites();
      } catch (error) {
        console.error(
          "Error loading favorites:",
          error
        );
      } finally {
        setLoading(false);
      }
    }

    loadProperties();

    window.addEventListener(
      "favoritesUpdated",
      loadFavorites
    );

    return () => {
      window.removeEventListener(
        "favoritesUpdated",
        loadFavorites
      );
    };

  }, []);


  const favoriteProperties = properties.filter(
    (property) =>
      favorites.includes(property.id)
  );


  return (
    <div className="min-h-screen bg-gray-100">

      <section className="bg-white border-b">
        <div className="mx-auto max-w-7xl px-6 py-12">

          <h1 className="text-4xl font-bold">
            ❤️ My Favorite Properties
          </h1>

          <p className="mt-3 text-gray-600">
            Your saved dream homes and investment properties.
          </p>

        </div>
      </section>


      <section className="mx-auto max-w-7xl px-6 py-12">

        {loading ? (

          <div className="text-center text-xl">
            Loading favorites...
          </div>

        ) : favoriteProperties.length === 0 ? (

          <div className="
            rounded-2xl
            bg-white
            p-10
            text-center
            shadow
          ">
            <h2 className="text-2xl font-bold">
              No favorite properties yet
            </h2>

            <p className="mt-3 text-gray-500">
              Tap the ❤️ icon on any property to save it here.
            </p>

          </div>

        ) : (

          <div className="
            grid
            gap-8
            md:grid-cols-3
          ">

            {favoriteProperties.map((property) => (

              <PropertyCard
                key={property.id}
                id={property.id}
                image={
                  property.image || heroHouse
                }
                title={property.title}
                location={
                  `${property.city}, ${property.country}`
                }
                price={
                  `${property.currency} ${Number(property.price).toLocaleString()}`
                }
                bedrooms={property.bedrooms}
                bathrooms={property.bathrooms}
                size={
                  property.area || "N/A"
                }
                status={property.status}
              />

            ))}

          </div>

        )}

      </section>

    </div>
  );
}
