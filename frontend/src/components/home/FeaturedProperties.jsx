import PropertyCard from "./PropertyCard";
import heroHouse from "@/assets/images/hero-house.jpg";

export default function FeaturedProperties() {
  return (
    <section className="bg-gray-100 py-20">
      <div className="mx-auto max-w-7xl px-6">
        <h2 className="mb-12 text-center text-5xl font-bold">
          Featured Properties
        </h2>

        <div className="grid gap-8 md:grid-cols-3">
          <PropertyCard
  id={3}
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
  id={4}
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
  id={5}
  image={heroHouse}
  title="Beachfront Estate"
  location="Marbella, Spain"
  price="€3,900,000"
  bedrooms={7}
  bathrooms={6}
  size="1150 sqm"
  status="NEW LISTING"
/>
 
        </div>
      </div>
    </section>
  );
}
