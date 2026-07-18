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

import propertyImage from "@/assets/images/hero-house.jpg";

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
  const displayImage = image || propertyImage;

  const [liked, setLiked] = useState(false);


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

      favorites = favorites.filter(
        (item) => item !== id
      );

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

      <div className="relative">

        <img
          src={displayImage}
          alt={title}
          className="
            h-56
            sm:h-64
            w-full
            object-cover
            transition
            duration-700
            group-hover:scale-110
          "
        />


        <div className="
          absolute
          inset-0
          bg-gradient-to-t
          from-black/40
          to-transparent
        " />


        <span
          className="
            absolute
            left-4
            top-4
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
            right-4
            top-4
            z-20
            rounded-full
            bg-white
            p-2
            shadow-lg
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



      <div className="p-5">

        <h3 className="text-xl font-bold line-clamp-2">
          {title}
        </h3>


        <p className="
          mt-2
          flex
          items-center
          gap-2
          text-sm
          text-gray-500
        ">
          <MapPin size={18} />
          {location}
        </p>



        <div className="
          mt-5
          grid
          grid-cols-3
          gap-2
        ">

          <div className="
            rounded-xl
            bg-gray-100
            p-2
            text-center
            text-sm
          ">
            <BedDouble className="mx-auto h-5" />
            {bedrooms || 0}
          </div>


          <div className="
            rounded-xl
            bg-gray-100
            p-2
            text-center
            text-sm
          ">
            <Bath className="mx-auto h-5" />
            {bathrooms || 0}
          </div>


          <div className="
            rounded-xl
            bg-gray-100
            p-2
            text-center
            text-sm
          ">
            <Ruler className="mx-auto h-5" />
            {size || "N/A"}
          </div>

        </div>



        <p className="
          mt-5
          text-2xl
          font-bold
          text-green-600
        ">
          {price}
        </p>



        <Link to={`/property/${id}`}>

          <Button className="
            mt-5
            w-full
            rounded-xl
            py-5
          ">
            View Details →
          </Button>

        </Link>


      </div>

    </div>
  );
}
