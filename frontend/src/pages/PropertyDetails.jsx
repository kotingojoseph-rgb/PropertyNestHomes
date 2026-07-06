import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

export default function PropertyDetails() {
  const { id } = useParams();

  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}/api/properties/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error("Property not found");
        return res.json();
      })
      .then((data) => {
        setProperty(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, [id]);

  if (loading) {
    return (
      <div className="p-10 text-center text-2xl font-bold">
        Loading property...
      </div>
    );
  }

  if (!property) {
    return (
      <div className="p-10 text-center text-2xl font-bold">
        Property not found.
      </div>
    );
  }

  return (
    <section className="bg-gray-100 py-12">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid gap-10 lg:grid-cols-2">

          {/* Left */}
          <div>
            <img
              src={
                property.image_url ||
                "https://images.unsplash.com/photo-1600585154340-be6161a56a0c"
              }
              alt={property.title}
              className="h-[500px] w-full rounded-3xl object-cover shadow-xl"
            />
          </div>

          {/* Right */}
          <div>
            <span className="rounded-full bg-green-600 px-4 py-2 font-bold text-white">
              {property.status}
            </span>

            <h1 className="mt-6 text-5xl font-bold">
              {property.title}
            </h1>

            <p className="mt-3 text-xl text-gray-500">
              📍 {property.city}, {property.country}
            </p>

            <h2 className="mt-8 text-5xl font-bold text-green-600">
              {property.currency} {Number(property.price).toLocaleString()}
            </h2>

            <div className="mt-10 grid grid-cols-2 gap-6 rounded-2xl bg-white p-6 shadow">

              <div>
                <p className="text-sm text-gray-500">Bedrooms</p>
                <p className="text-2xl font-bold">{property.bedrooms}</p>
              </div>

              <div>
                <p className="text-sm text-gray-500">Bathrooms</p>
                <p className="text-2xl font-bold">{property.bathrooms}</p>
              </div>

              <div>
                <p className="text-sm text-gray-500">Area</p>
                <p className="text-2xl font-bold">
                  {property.area || property.size || "N/A"}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-500">Garage</p>
                <p className="text-2xl font-bold">
                  {property.garage || "N/A"}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-500">Year Built</p>
                <p className="text-2xl font-bold">
                  {property.year_built || "N/A"}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-500">Property Type</p>
                <p className="text-2xl font-bold">
                  {property.property_type}
                </p>
              </div>

            </div>

            <div className="mt-8 flex gap-4">
              <Button size="lg">Contact Agent</Button>
              <Button size="lg" variant="outline">
                Save Property
              </Button>
            </div>

          </div>
        </div>

        <div className="mt-12 rounded-3xl bg-white p-10 shadow">
          <h2 className="text-3xl font-bold">
            Property Description
          </h2>

          <p className="mt-6 text-lg leading-8 text-gray-600">
            {property.description || "No description available."}
          </p>
        </div>

        <div className="mt-10 rounded-3xl bg-white p-10 shadow">
          <h2 className="text-3xl font-bold">
            Property Location
          </h2>

          <p className="mt-4 text-gray-600">
            {property.address}, {property.city}, {property.country}
          </p>
        </div>
      </div>
    </section>
  );
}
