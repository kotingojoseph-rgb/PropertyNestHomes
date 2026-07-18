import { useEffect, useState } from "react";
import PropertyCard from "@/components/home/PropertyCard";
import heroHouse from "@/assets/images/hero-house.jpg";
import { getProperties } from "@/api/propertyApi";

export default function Buy() {
  const [properties, setProperties] = useState([]);
  const [filteredProperties, setFilteredProperties] = useState([]);

  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");


  useEffect(() => {
    async function loadProperties() {
      try {
        const data = await getProperties();

        setProperties(data);
        setFilteredProperties(data);

      } catch (error) {
        console.error("Error loading properties:", error);
      } finally {
        setLoading(false);
      }
    }

    loadProperties();

  }, []);



  useEffect(() => {

    let results = properties;


    if (search) {
      results = results.filter((property) =>
        `${property.title} ${property.city} ${property.country}`
          .toLowerCase()
          .includes(search.toLowerCase())
      );
    }


    if (status) {
      results = results.filter(
        (property) => property.status === status
      );
    }


    setFilteredProperties(results);


  }, [search, status, properties]);



  return (
    <div className="bg-gray-100 min-h-screen">


      <section className="bg-white border-b">

        <div className="max-w-7xl mx-auto px-6 py-16">


          <h1 className="text-5xl font-bold text-gray-900">
            Find Your Dream Property
          </h1>


          <p className="mt-5 max-w-3xl text-lg text-gray-600">
            Explore premium homes, apartments, villas, duplexes,
            and investment properties worldwide.
          </p>



          <div className="mt-10 grid md:grid-cols-3 gap-5">


            <input
              placeholder="Search by city, country, or property..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="rounded-xl border p-4"
            />


            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="rounded-xl border p-4"
            >

              <option value="">
                All Properties
              </option>

              <option value="For Sale">
                For Sale
              </option>

              <option value="For Rent">
                For Rent
              </option>

            </select>


            <div className="rounded-xl bg-green-600 p-4 text-center text-white font-bold">

              {filteredProperties.length} Properties Available

            </div>


          </div>


        </div>

      </section>




      <section className="max-w-7xl mx-auto px-6 py-12">


        {loading ? (

          <div className="text-center text-xl">
            Loading properties...
          </div>


        ) : filteredProperties.length === 0 ? (

          <div className="rounded-2xl bg-white p-10 text-center shadow">

            <h2 className="text-2xl font-bold">
              No properties found
            </h2>

            <p className="mt-3 text-gray-500">
              Try changing your search filters.
            </p>

          </div>


        ) : (

          <div className="grid gap-8 md:grid-cols-3">


            {filteredProperties.map((property) => (

              <PropertyCard
                key={property.id}
                id={property.id}
                image={property.image || heroHouse}
                title={property.title}
                location={`${property.city}, ${property.country}`}
                price={`${property.currency} ${Number(property.price).toLocaleString()}`}
                bedrooms={property.bedrooms}
                bathrooms={property.bathrooms}
                size={property.area || "N/A"}
                status={property.status}
              />

            ))}


          </div>

        )}


      </section>


    </div>
  );
}
