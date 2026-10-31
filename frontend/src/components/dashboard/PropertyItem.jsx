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
  promotions = [],
  promotingPropertyId,
  onPromote,
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

  const activePromotion = promotions.find(
    (promotion) =>
      Number(promotion.property_id) === Number(property?.id)
  );

  const isPromoting =
    Number(promotingPropertyId) === Number(property?.id);

  const promotionPlans = [
    { key: "featured", label: "Featured", price: 2000 },
    { key: "premium", label: "Premium", price: 5000 },
    { key: "business", label: "Business", price: 10000 },
  ];

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

        <p className="mt-1 break-words text-sm leading-5 text-gray-500">
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

        {isVerified && (
          <div className="mt-4 rounded-xl border border-gray-200 p-3">
            <p className="text-sm font-bold text-gray-900">
              Promote this property
            </p>

            {activePromotion ? (
              <p className="mt-2 text-sm font-semibold text-green-700">
                Active promotion: {activePromotion.plan}
              </p>
            ) : (
              <div className="mt-3 grid grid-cols-1 gap-2">
                {promotionPlans.map((plan) => (
                  <button
                    key={plan.key}
                    type="button"
                    disabled={isPromoting}
                    onClick={() => onPromote?.(property, plan.key)}
                    className="flex min-h-10 items-center justify-between rounded-lg bg-green-700 px-3 py-2 text-sm font-semibold text-white transition hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <span>
                      {isPromoting ? "Opening checkout..." : plan.label}
                    </span>
                    <span>₦{plan.price.toLocaleString()}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="mt-4 grid min-w-0 grid-cols-3 gap-2 sm:mt-5 sm:flex sm:flex-wrap">
          <button
            type="button"
            onClick={() => onView?.(property)}
            className="min-h-11 min-w-0 rounded-lg bg-gray-900 px-1.5 py-2 text-xs font-semibold text-white transition hover:bg-gray-800 sm:px-3"
          >
            View
          </button>

          <button
            type="button"
            onClick={() => onEdit?.(property)}
            className="min-h-11 min-w-0 rounded-lg bg-blue-600 px-1.5 py-2 text-xs font-semibold text-white transition hover:bg-blue-700 sm:px-3"
          >
            Edit
          </button>

          <button
            type="button"
            onClick={() => onDelete?.(property.id)}
            className="min-h-11 min-w-0 rounded-lg bg-red-600 px-1.5 py-2 text-xs font-semibold text-white transition hover:bg-red-700 sm:px-3"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
