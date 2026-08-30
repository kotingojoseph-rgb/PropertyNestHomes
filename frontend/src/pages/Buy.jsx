import { useEffect, useState } from "react";
import PropertyCard from "@/components/home/PropertyCard";

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

console.log("Properties received:", data);
console.log("Is array?", Array.isArray(data));
console.log("Count:", data.length);

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
    <div className="min-h-screen w-full bg-gray-100">


      <section className="bg-white border-b">

        <div className="mx-auto w-full max-w-7xl px-3 py-8 sm:px-6 sm:py-12 lg:py-16">


          <h1 className="text-3xl font-bold leading-tight text-gray-900 sm:text-4xl lg:text-5xl">
            Find Your Dream Property
          </h1>


          <p className="mt-3 max-w-3xl text-sm leading-6 text-gray-600 sm:mt-5 sm:text-base lg:text-lg">
            Explore premium homes, apartments, villas, duplexes,
            and investment properties worldwide.
          </p>



          <div className="mt-6 grid gap-3 sm:mt-8 sm:gap-4 md:grid-cols-3">


            <input
              placeholder="Search by city, country, or property..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="min-h-12 w-full rounded-xl border px-4 py-3 text-sm outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100 sm:text-base"
            />


            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="min-h-12 w-full rounded-xl border px-4 py-3 text-sm outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100 sm:text-base"
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


            <div className="flex min-h-12 items-center justify-center rounded-xl bg-green-600 px-4 py-3 text-center text-sm font-bold text-white sm:text-base">

              {filteredProperties.length} Properties Available

            </div>


          </div>


        </div>

      </section>




      <section className="mx-auto w-full max-w-7xl px-3 py-7 sm:px-6 sm:py-10 lg:py-12">


        {loading ? (

          <div className="text-center text-xl">
            Loading properties...
          </div>


        ) : filteredProperties.length === 0 ? (

          <div className="rounded-2xl bg-white p-6 text-center shadow sm:p-10">

            <h2 className="text-xl font-bold sm:text-2xl">
              No properties found
            </h2>

            <p className="mt-3 text-gray-500">
              Try changing your search filters.
            </p>

          </div>


        ) : (

          <div className="grid min-w-0 gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">


            {filteredProperties.map((property) => (

              <PropertyCard
  key={property.id}
  id={property.id}
  image={property.cover_image}
  title={property.title}
  location={`${property.city || "Nigeria"}, ${property.country || ""}`}
  price={`${property.currency || "NGN"} ${Number(
    property.price || 0
  ).toLocaleString()}`}
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
