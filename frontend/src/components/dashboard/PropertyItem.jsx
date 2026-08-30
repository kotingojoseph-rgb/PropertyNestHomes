import { useMemo } from "react";

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

export default function PropertyItem({
  property,
  onDelete,
  onEdit,
  onView,
}) {
  const fallbackImage = useMemo(() => {
    const propertyId = Number(property?.id) || 0;
    return fallbackImages[propertyId % fallbackImages.length];
  }, [property?.id]);

  // Backend getMyProperties returns pi.image_url
  const imageUrl =
    property?.image_url ||
    property?.cover_image ||
    property?.image ||
    fallbackImage;

  const verificationStatus =
    String(property?.verification_status || "pending").toLowerCase();

  const isVerified = verificationStatus === "verified";

  return (
    <div className="min-w-0 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
      <div className="relative">
        <img
          src={imageUrl}
          alt={property?.title || "Property"}
          className="h-48 w-full object-cover sm:h-52"
        />

        <div className="absolute left-3 top-3">
          <span
            className={`rounded-full px-3 py-1 text-xs font-bold shadow ${
              isVerified
                ? "bg-green-600 text-white"
                : "bg-yellow-100 text-yellow-800"
            }`}
          >
            {isVerified ? "Verified" : "Under Review"}
          </span>
        </div>
      </div>

      <div className="p-4 sm:p-5">
        <h3 className="truncate text-lg font-bold text-gray-900">
          {property?.title || "Untitled Property"}
        </h3>

        <p className="mt-1 text-sm text-gray-500">
          {[
            property?.city,
            property?.state_province,
            property?.country,
          ]
            .filter(Boolean)
            .join(", ") || "Location unavailable"}
        </p>

        <p className="mt-3 text-lg font-bold text-green-700 sm:mt-4 sm:text-xl">
          {property?.currency || "NGN"}{" "}
          {Number(property?.price || 0).toLocaleString()}
        </p>

        <div className="mt-4 grid grid-cols-3 gap-2 sm:mt-5 sm:flex sm:flex-wrap">
          <button
            type="button"
            onClick={() => onView?.(property)}
            className="min-h-11 rounded-lg bg-gray-900 px-2 py-2 text-xs font-semibold text-white transition hover:bg-gray-800 sm:px-3"
          >
            View
          </button>

          <button
            type="button"
            onClick={() => onEdit?.(property)}
            className="min-h-11 rounded-lg bg-blue-600 px-2 py-2 text-xs font-semibold text-white transition hover:bg-blue-700 sm:px-3"
          >
            Edit
          </button>

          <button
            type="button"
            onClick={() => onDelete?.(property.id)}
            className="min-h-11 rounded-lg bg-red-600 px-2 py-2 text-xs font-semibold text-white transition hover:bg-red-700 sm:px-3"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
