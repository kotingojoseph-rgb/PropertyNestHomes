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

      <section className="border-b bg-white">
        <div className="mx-auto w-full max-w-7xl px-3 py-8 sm:px-6 sm:py-12 lg:py-16">

          <h1 className="text-3xl font-bold leading-tight text-gray-900 sm:text-4xl lg:text-5xl">
            Find Your Dream Property
          </h1>

          <p className="mt-3 max-w-3xl text-sm leading-6 text-gray-600 sm:mt-5 sm:text-base lg:text-lg">
            Explore homes, apartments, villas, duplexes, rental properties,
            and other real estate listings available through PropertyNestHomes.
            Search by location or listing status to find properties that match
            what you are looking for.
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
              <option value="">All Properties</option>
              <option value="For Sale">For Sale</option>
              <option value="For Rent">For Rent</option>
            </select>

            <div className="flex min-h-12 items-center justify-center rounded-xl bg-green-600 px-4 py-3 text-center text-sm font-bold text-white sm:text-base">
              {filteredProperties.length} Properties Available
            </div>

          </div>

        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-3 py-7 sm:px-6 sm:py-10 lg:py-12">

        <div className="mb-8 max-w-4xl">
          <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl">
            Explore Property Listings
          </h2>

          <p className="mt-3 text-sm leading-7 text-gray-600 sm:text-base">
            PropertyNestHomes helps buyers, renters, and property seekers
            compare available listings in one place. Each listing can provide
            information such as location, price, property type, bedrooms,
            bathrooms, area, availability, and other details supplied with the
            property.
          </p>

          <p className="mt-3 text-sm leading-7 text-gray-600 sm:text-base">
            Open a property listing to review its available information,
            photographs, location details, and contact options. Where a
            property has been marked as verified on the platform, that status
            is displayed on the listing.
          </p>
        </div>

        {loading ? (

          <div className="rounded-2xl bg-white p-8 text-center text-lg text-gray-600 shadow">
            Loading properties...
          </div>

        ) : filteredProperties.length === 0 ? (

          <div className="rounded-2xl bg-white p-6 text-center shadow sm:p-10">
            <h2 className="text-xl font-bold sm:text-2xl">
              No properties found
            </h2>

            <p className="mt-3 text-gray-500">
              Try changing your search terms or property status filter.
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

      <section className="border-t bg-white">
        <div className="mx-auto w-full max-w-7xl px-3 py-10 sm:px-6 sm:py-14">

          <div className="max-w-4xl">
            <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl">
              How to Evaluate a Property Listing
            </h2>

            <p className="mt-3 text-sm leading-7 text-gray-600 sm:text-base">
              Finding a suitable property is only the first step. Before
              making a purchase, rental commitment, or investment decision,
              review the listing information carefully and ask the relevant
              property contact for any details that are important to you.
            </p>
          </div>

          <div className="mt-8 grid gap-5 md:grid-cols-3">

            <article className="rounded-2xl border bg-gray-50 p-6">
              <h3 className="text-lg font-bold text-gray-900">
                Review the Details
              </h3>

              <p className="mt-3 text-sm leading-6 text-gray-600">
                Compare the property's location, price, type, bedrooms,
                bathrooms, size, availability, photographs, and description.
                Make sure the information meets your requirements before
                arranging the next step.
              </p>
            </article>

            <article className="rounded-2xl border bg-gray-50 p-6">
              <h3 className="text-lg font-bold text-gray-900">
                Ask Questions
              </h3>

              <p className="mt-3 text-sm leading-6 text-gray-600">
                Contact the appropriate property contact when you need more
                information about ownership, availability, viewing
                arrangements, documents, pricing, fees, or other matters that
                are not fully covered by the listing.
              </p>
            </article>

            <article className="rounded-2xl border bg-gray-50 p-6">
              <h3 className="text-lg font-bold text-gray-900">
                Complete Your Due Diligence
              </h3>

              <p className="mt-3 text-sm leading-6 text-gray-600">
                PropertyNestHomes provides a platform for property discovery
                and connections. Users should independently verify important
                property, ownership, legal, financial, and transaction
                information before entering into an agreement or sending
                funds.
              </p>
            </article>

          </div>

          <div className="mt-10 rounded-2xl bg-gray-50 p-6 sm:p-8">
            <h2 className="text-xl font-bold text-gray-900 sm:text-2xl">
              Buying or Renting With PropertyNestHomes
            </h2>

            <p className="mt-3 max-w-4xl text-sm leading-7 text-gray-600 sm:text-base">
              Whether you are looking for a home, rental property, investment
              opportunity, or another type of real estate, start by defining
              the location, property type, budget, and features that matter to
              you. Use the available search tools to narrow the listings, then
              review individual properties before contacting the relevant
              property contact.
            </p>

            <p className="mt-3 max-w-4xl text-sm leading-7 text-gray-600 sm:text-base">
              Property availability and listing information can change.
              Always confirm the current price, status, availability, and
              transaction requirements directly with the appropriate property
              contact before making a decision.
            </p>
          </div>

        </div>
      </section>

    </div>
  );
}
