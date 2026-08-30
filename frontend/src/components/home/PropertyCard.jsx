import { Button } from "@/components/ui/button";
import {
  Heart,
  BedDouble,
  Bath,
  Ruler,
  MapPin,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useState, useEffect } from "react";

import apartmentImage from "@/assets/images/properties/apartment.jpg";
import interiorImage from "@/assets/images/properties/interior.jpg";
import luxuryHomeImage from "@/assets/images/properties/luxury-home.jpg";
import modernHouseImage from "@/assets/images/properties/modern-house.jpg";
import modernVillaImage from "@/assets/images/properties/modern-villa.jpg";
import penthouseImage from "@/assets/images/properties/penthouse.jpg";

const fallbackImages = [
  apartmentImage,
  interiorImage,
  luxuryHomeImage,
  modernHouseImage,
  modernVillaImage,
  penthouseImage,
];

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
  const fallbackImage =
    fallbackImages[(Number(id) || 0) % fallbackImages.length];

  const [displayImage, setDisplayImage] = useState(
    image || fallbackImage
  );

  const [liked, setLiked] = useState(false);

  useEffect(() => {
    setDisplayImage(image || fallbackImage);
  }, [image, fallbackImage]);

  useEffect(() => {
    const favorites = JSON.parse(
      localStorage.getItem("favorites") || "[]"
    );

    setLiked(favorites.includes(id));
  }, [id]);

  function toggleFavorite() {
    let favorites = JSON.parse(
      localStorage.getItem("favorites") || "[]"
    );

    if (favorites.includes(id)) {
      favorites = favorites.filter((item) => item !== id);
      setLiked(false);
    } else {
      favorites.push(id);
      setLiked(true);
    }

    localStorage.setItem(
      "favorites",
      JSON.stringify(favorites)
    );

    window.dispatchEvent(
      new Event("favoritesUpdated")
    );
  }

  return (
    <div
      className="
        group
        overflow-hidden
        rounded-2xl
        bg-white
        border
        shadow-md
        transition
        hover:-translate-y-2
        hover:shadow-xl
      "
    >
      <div className="relative min-w-0">
        <img
          src={displayImage}
          alt={title || "Property"}
          onError={() => {
            setDisplayImage(fallbackImage);
          }}
          className="
            h-48
            w-full
            object-cover
            transition
            duration-700
            group-hover:scale-110
            sm:h-56
            lg:h-64
          "
        />

        <div
          className="
            absolute
            inset-0
            bg-gradient-to-t
            from-black/40
            to-transparent
          "
        />

        <span
          className="
            absolute
            left-3
            top-3
            sm:left-4
            sm:top-4
            rounded-full
            bg-green-600
            px-3
            py-1
            text-xs
            font-bold
            text-white
          "
        >
          {status || "Available"}
        </span>

        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleFavorite();
          }}
          className="
            absolute
            right-3
            top-3
            z-20
            flex
            h-11
            w-11
            items-center
            justify-center
            rounded-full
            bg-white
            shadow-lg
            sm:right-4
            sm:top-4
            transition
            hover:scale-110
          "
        >
          <Heart
            className={`
              h-5
              w-5
              ${
                liked
                  ? "fill-red-500 text-red-500"
                  : "text-gray-500"
              }
            `}
          />
        </button>
      </div>

      <div className="p-4 sm:p-5">
        <h3 className="line-clamp-2 text-lg font-bold sm:text-xl">
          {title || "Untitled Property"}
        </h3>

        <p
          className="
            mt-2
            flex
            min-w-0
            items-start
            gap-2
            text-sm
            leading-5
            text-gray-500
          "
        >
          <MapPin className="mt-0.5 shrink-0" size={18} />
          {location || "Location unavailable"}
        </p>

        <div
          className="
            mt-4
            grid
            grid-cols-3
            gap-2
            sm:mt-5
          "
        >
          <div
            className="
              min-w-0
              rounded-xl
              bg-gray-100
              px-1.5
              py-2
              text-center
              text-xs
              sm:p-2
              sm:text-sm
            "
          >
            <BedDouble className="mx-auto h-5" />
            {bedrooms || 0}
          </div>

          <div
            className="
              min-w-0
              rounded-xl
              bg-gray-100
              px-1.5
              py-2
              text-center
              text-xs
              sm:p-2
              sm:text-sm
            "
          >
            <Bath className="mx-auto h-5" />
            {bathrooms || 0}
          </div>

          <div
            className="
              min-w-0
              rounded-xl
              bg-gray-100
              px-1.5
              py-2
              text-center
              text-xs
              sm:p-2
              sm:text-sm
            "
          >
            <Ruler className="mx-auto h-5" />
            {size || "N/A"}
          </div>
        </div>

        <p
          className="
            mt-4
            break-words
            text-xl
            font-bold
            text-green-600
            sm:mt-5
            sm:text-2xl
          "
        >
          {price}
        </p>

        <Link to={`/property/${id}`}>
          <Button
            className="
              mt-4
              min-h-11
              w-full
              rounded-xl
              py-3.5
              text-sm
              sm:mt-5
              sm:py-5
              sm:text-base
            "
          >
            View Details →
          </Button>
        </Link>
      </div>
    </div>
  );
}
