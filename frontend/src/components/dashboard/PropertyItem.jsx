import { Link } from "react-router-dom";
import propertyImage from "@/assets/images/hero-house.jpg";


export default function PropertyItem({ property, onDelete }) {

  return (

    <div className="group overflow-hidden rounded-3xl bg-white shadow-md border">


      <img
        src={property.cover_image || propertyImage}
        alt={property.title}
        className="h-60 w-full object-cover"
      />


      <div className="p-6">


        <h2 className="text-2xl font-bold">
          {property.title}
        </h2>


        <p className="text-gray-500 mt-2">
          📍 {property.city}, {property.country}
        </p>


        <p className="text-3xl text-green-600 font-bold mt-4">
          {property.currency} {property.price}
        </p>


        <div className="mt-4 flex gap-3">

          <span className="bg-gray-100 px-3 py-1 rounded-full">
            🛏 {property.bedrooms || 0}
          </span>

          <span className="bg-gray-100 px-3 py-1 rounded-full">
            🚿 {property.bathrooms || 0}
          </span>

        </div>


        <div className="mt-6 flex gap-3">


          <Link
            to={`/property/${property.id}`}
            className="bg-black text-white px-5 py-2 rounded-xl"
          >
            View
          </Link>


          <Link
            to={`/edit-property/${property.id}`}
            className="bg-blue-600 text-white px-5 py-2 rounded-xl"
          >
            Edit
          </Link>


          <button
            onClick={()=>onDelete(property.id)}
            className="bg-red-600 text-white px-5 py-2 rounded-xl"
          >
            Delete
          </button>


        </div>


      </div>

    </div>

  );
}
