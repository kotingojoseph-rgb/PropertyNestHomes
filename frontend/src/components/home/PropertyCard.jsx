import { Button } from "@/components/ui/button";
import { Heart, BedDouble, Bath, Ruler } from "lucide-react";
import { Link } from "react-router-dom";

export default function PropertyCard({
  id,
  image,
  title,
  location,
  price,
  bedrooms,
  bathrooms,
  size,
  status,
}) {
  
  

  return (
    <div className="group overflow-hidden rounded-2xl bg-white shadow-lg transition-all duration-500 hover:-translate-y-3 hover:shadow-2xl">

      <div className="relative overflow-hidden">

        <img
          src={image}
          alt={title}
          className="h-64 w-full object-cover transition duration-700 group-hover:scale-110"
        />

        <span className="absolute left-4 top-4 rounded-full bg-green-600 px-4 py-1 text-sm font-bold text-white">
          {status}
        </span>

        <button className="absolute right-4 top-4 rounded-full bg-white p-2 shadow-md">
          <Heart className="h-5 w-5 text-red-500" />
        </button>

      </div>

      <div className="p-6">

        <h3 className="text-2xl font-bold">
          {title}
        </h3>

        <p className="mt-2 text-gray-500">
          📍 {location}
        </p>

        <div className="mt-5 flex justify-between text-gray-600">

  <div className="flex items-center gap-2">
    <BedDouble className="h-5 w-5" />
    <span>{bedrooms} Beds</span>
  </div>

  <div className="flex items-center gap-2">
    <Bath className="h-5 w-5" />
    <span>{bathrooms} Baths</span>
  </div>

  <div className="flex items-center gap-2">
    <Ruler className="h-5 w-5" />
    <span>{size}</span>
  </div>

</div>

  

        <p className="mt-6 text-3xl font-bold text-green-600">
          {price}
        </p>

        <div className="mt-4 text-yellow-500 text-xl">
          ⭐⭐⭐⭐⭐
        </div>

        <Link to={`/property/${id}`}>
  <Button className="mt-6 w-full">
    View Details →
  </Button>
</Link>

      </div>

    </div>
  );
}
