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

  const imageUrl = property?.cover_image || fallbackImage;

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      <img
        src={imageUrl}
        alt={property?.title || "Property"}
        className="h-40 w-full object-cover"
      />

      <div className="p-4">
        <h3 className="truncate text-base font-semibold text-gray-900">
          {property?.title || "Untitled Property"}
        </h3>

        <p className="mt-1 text-sm text-gray-500">
          {property?.city || "Location unavailable"}
        </p>

        <div className="mt-4 flex items-center gap-2">
          <button
            type="button"
            onClick={() => onView?.(property)}
            className="rounded-lg bg-gray-900 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-gray-800"
          >
            View
          </button>

          <button
            type="button"
            onClick={() => onEdit?.(property)}
            className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-blue-700"
          >
            Edit
          </button>

          <button
            type="button"
            onClick={() => onDelete?.(property)}
            className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-red-700"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
