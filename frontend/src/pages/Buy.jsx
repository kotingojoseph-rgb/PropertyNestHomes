import PropertyCard from "@/components/home/PropertyCard";
import heroHouse from "@/assets/images/hero-house.jpg";

export default function Buy() {
  return (
    <div className="bg-gray-100 min-h-screen">

      {/* Header */}
      <section className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-6 py-14">

          <h1 className="text-5xl font-bold">
            Buy Properties
          </h1>

          <p className="mt-4 max-w-3xl text-lg text-gray-600">
            Browse premium homes, luxury villas, apartments, penthouses,
            beachfront estates, and investment opportunities from trusted
            real estate professionals around the world.
          </p>

        </div>
      </section>

      {/* Search Filters */}
      <section className="max-w-7xl mx-auto px-6 py-8">

        <div className="grid gap-4 md:grid-cols-5">

          <input
            type="text"
            placeholder="Location"
            className="rounded-xl border p-4"
          />

          <select className="rounded-xl border p-4">
            <option>Property Type</option>
            <option>House</option>
            <option>Apartment</option>
            <option>Villa</option>
            <option>Penthouse</option>
          </select>

          <select className="rounded-xl border p-4">
            <option>Bedrooms</option>
            <option>1+</option>
            <option>2+</option>
            <option>3+</option>
            <option>4+</option>
            <option>5+</option>
          </select>

          <select className="rounded-xl border p-4">
            <option>Price Range</option>
            <option>$100k+</option>
            <option>$500k+</option>
            <option>$1M+</option>
            <option>$5M+</option>
          </select>

          <button className="rounded-xl bg-green-600 p-4 font-semibold text-white hover:bg-green-700">
            Search
          </button>

        </div>

      </section>

      {/* Property Grid */}
      <section className="max-w-7xl mx-auto px-6 pb-16">

        <div className="grid gap-8 md:grid-cols-3">

          <PropertyCard
            image={heroHouse}
            title="Luxury Waterfront Villa"
            location="Miami, USA"
            price="$2,850,000"
            bedrooms={6}
            bathrooms={5}
            size="920 sqm"
            status="FOR SALE"
          />

          <PropertyCard
            image={heroHouse}
            title="Skyline Penthouse"
            location="Dubai, UAE"
            price="$4,200,000"
            bedrooms={5}
            bathrooms={6}
            size="780 sqm"
            status="FEATURED"
          />

          <PropertyCard
            image={heroHouse}
            title="Beachfront Estate"
            location="Marbella, Spain"
            price="€3,900,000"
            bedrooms={7}
            bathrooms={6}
            size="1150 sqm"
            status="NEW LISTING"
          />

          <PropertyCard
            image={heroHouse}
            title="Luxury Apartment"
            location="London, UK"
            price="£1,750,000"
            bedrooms={3}
            bathrooms={2}
            size="350 sqm"
            status="FOR SALE"
          />

          <PropertyCard
            image={heroHouse}
            title="Modern Smart Home"
            location="Toronto, Canada"
            price="$1,950,000"
            bedrooms={5}
            bathrooms={4}
            size="640 sqm"
            status="FEATURED"
          />

          <PropertyCard
            image={heroHouse}
            title="Ocean View Mansion"
            location="California, USA"
            price="$7,800,000"
            bedrooms={8}
            bathrooms={9}
            size="1800 sqm"
            status="LUXURY"
          />

               </div>

        {/* Pagination */}
        <div className="mt-16 flex items-center justify-center gap-3">

          <button className="rounded-lg border px-4 py-2 hover:bg-gray-100">
            ← Previous
          </button>

          <button className="rounded-lg bg-green-600 px-4 py-2 text-white">
            1
          </button>

          <button className="rounded-lg border px-4 py-2 hover:bg-gray-100">
            2
          </button>

          <button className="rounded-lg border px-4 py-2 hover:bg-gray-100">
            3
          </button>

          <button className="rounded-lg border px-4 py-2 hover:bg-gray-100">
            4
          </button>

          <button className="rounded-lg border px-4 py-2 hover:bg-gray-100">
            Next →
          </button>

        </div>

      </section>

    </div>
  );
}
