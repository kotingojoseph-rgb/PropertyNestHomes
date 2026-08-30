import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

import Lightbox from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";

import heroHouse from "@/assets/images/hero-house.jpg";

export default function PropertyDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [property, setProperty] = useState(null);
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [photoIndex, setPhotoIndex] = useState(0);

  const [investmentAmount, setInvestmentAmount] = useState("");
  const [investmentCurrency, setInvestmentCurrency] = useState("NGN");
  const [investmentNotes, setInvestmentNotes] = useState("");
  const [investmentLoading, setInvestmentLoading] = useState(false);
  const [investmentError, setInvestmentError] = useState("");
  const [investmentSuccess, setInvestmentSuccess] = useState("");

  const API_URL = import.meta.env.VITE_API_URL;

  useEffect(() => {
    fetchProperty();
  }, [id]);

  useEffect(() => {
    if (!property) return;

    const locationText = [
      property.city,
      property.state_province,
      property.country,
    ]
      .filter(Boolean)
      .join(", ") || property.location || "Nigeria";

    const title = `${property.title} | ${locationText} | PropertyNestHomes`;

    const description = [
      property.description,
      property.property_type
        ? `Type: ${property.property_type}.`
        : "",
      property.bedrooms
        ? `${property.bedrooms} bedrooms.`
        : "",
      property.bathrooms
        ? `${property.bathrooms} bathrooms.`
        : "",
    ]
      .filter(Boolean)
      .join(" ")
      .slice(0, 160);

    document.title = title;

    const setMeta = (attribute, key, value) => {
      let element = document.head.querySelector(
        `meta[${attribute}="${key}"]`
      );

      if (!element) {
        element = document.createElement("meta");
        element.setAttribute("meta", key);
        document.head.appendChild(element);
      }

      element.setAttribute("content", value);
    };

    const canonicalUrl =
      `${window.location.origin}/property/${property.id}`;

    let canonical =
      document.head.querySelector('link[rel="canonical"]');

    if (!canonical) {
      canonical = document.createElement("link");
      canonical.setAttribute("rel", "canonical");
      document.head.appendChild(canonical);
    }

    canonical.setAttribute("href", canonicalUrl);

    setMeta("name", "description", description);
    setMeta("property", "og:title", title);
    setMeta("property", "og:description", description);
    setMeta("property", "og:url", canonicalUrl);
    setMeta("name", "twitter:title", title);
    setMeta("name", "twitter:description", description);
  }, [property]);

  async function fetchProperty() {
    try {
      setLoading(true);

      const res = await fetch(
        `${API_URL}/api/properties/${id}`
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          data?.error || "Unable to load property."
        );
      }

      setProperty(data.property || data);

      const imageRes = await fetch(
        `${API_URL}/api/properties/${id}/images`
      );

      if (imageRes.ok) {
        const imageData = await imageRes.json();

        setImages(
          Array.isArray(imageData)
            ? imageData
            : Array.isArray(imageData?.images)
              ? imageData.images
              : []
        );
      } else {
        setImages([]);
      }
    } catch (err) {
      console.error("Unable to load property:", err);
      setProperty(null);
    } finally {
      setLoading(false);
    }
  }

  async function startChat() {
    const token = localStorage.getItem("token");

    if (!token) {
      navigate("/login");
      return;
    }

    try {
      const response = await fetch(
        `${API_URL}/api/chat/conversations`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            property_id: property.id,
            seller_id: property.owner_id,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error || "Unable to start conversation."
        );
      }

      navigate(`/chat/${data.id}`);
    } catch (error) {
      console.error("Unable to start chat:", error);
      alert(
        error.message ||
        "Unable to start conversation."
      );
    }
  }

  function contactSeller() {
    if (property.owner_phone) {
      window.location.href = `tel:${property.owner_phone}`;
      return;
    }

    if (property.owner_email) {
      window.location.href =
        `mailto:${property.owner_email}`;
      return;
    }

    alert("Seller contact information is unavailable.");
  }

  function isVerifiedProperty() {
    return (
      String(
        property?.verification_status || ""
      ).toLowerCase() === "verified"
    );
  }

  async function submitInvestment() {
    const token = localStorage.getItem("token");

    if (!token) {
      navigate("/login");
      return;
    }

    setInvestmentError("");
    setInvestmentSuccess("");

    const amount = Number(investmentAmount);

    if (
      !Number.isFinite(amount) ||
      amount <= 0
    ) {
      setInvestmentError(
        "Please enter a valid investment amount greater than zero."
      );
      return;
    }

    if (!isVerifiedProperty()) {
      setInvestmentError(
        "Only verified properties can receive investment requests."
      );
      return;
    }

    if (
      property.owner_id &&
      Number(property.owner_id) ===
        Number(
          (() => {
            try {
              const tokenPayload = JSON.parse(
                atob(
                  token.split(".")[1]
                    .replace(/-/g, "+")
                    .replace(/_/g, "/")
                )
              );

              return tokenPayload?.id;
            } catch {
              return null;
            }
          })()
        )
    ) {
      setInvestmentError(
        "You cannot invest in your own property."
      );
      return;
    }

    try {
      setInvestmentLoading(true);

      const response = await fetch(
        `${API_URL}/api/investments`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            property_id: property.id,
            amount,
            currency: investmentCurrency,
            notes:
              investmentNotes.trim() || undefined,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error ||
          "Unable to submit investment request."
        );
      }

      setInvestmentSuccess(
        "Investment request submitted successfully."
      );

      setInvestmentAmount("");
      setInvestmentNotes("");

      setTimeout(() => {
        navigate("/investments");
      }, 900);
    } catch (error) {
      console.error(
        "Investment submission failed:",
        error
      );

      setInvestmentError(
        error.message ||
        "Unable to submit investment request."
      );
    } finally {
      setInvestmentLoading(false);
    }
  }

  function getImageUrl(image) {
    if (!image) return heroHouse;

    if (typeof image === "string") {
      return image;
    }

    return (
      image.url ||
      image.image_url ||
      image.secure_url ||
      image.path ||
      heroHouse
    );
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-xl font-bold">
        Loading property...
      </div>
    );
  }

  if (!property) {
    return (
      <div className="flex min-h-screen items-center justify-center text-xl font-bold">
        Property not found.
      </div>
    );
  }

  const verified = isVerifiedProperty();

  const gallerySlides =
    images.length > 0
      ? images.map((image) => ({
          src: getImageUrl(image),
        }))
      : [
          {
            src: property.cover_image || heroHouse,
          },
        ];

  return (
    <div className="mx-auto w-full max-w-6xl min-w-0 px-3 py-4 sm:px-6 sm:py-6 lg:px-8">

      <button
        onClick={() => navigate(-1)}
        className="mb-4 min-h-11 rounded-xl bg-green-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-green-700 sm:mb-6 sm:text-base"
      >
        ← Back
      </button>

      <div className="overflow-hidden rounded-3xl bg-white shadow-xl">

        <button
          type="button"
          onClick={() => {
            setPhotoIndex(0);
            setLightboxOpen(true);
          }}
          className="block w-full"
        >
          <img
            src={
              property.cover_image ||
              gallerySlides[0]?.src ||
              heroHouse
            }
            alt={property.title}
            className="h-56 w-full object-cover sm:h-80 lg:h-96"
            onError={(e) => {
              e.currentTarget.src = heroHouse;
            }}
          />
        </button>

        {gallerySlides.length > 1 && (
          <div className="grid grid-cols-4 gap-2 p-2.5 sm:p-3">
            {gallerySlides.slice(0, 4).map(
              (slide, index) => (
                <button
                  key={`${slide.src}-${index}`}
                  type="button"
                  onClick={() => {
                    setPhotoIndex(index);
                    setLightboxOpen(true);
                  }}
                  className="min-h-16 overflow-hidden rounded-lg sm:min-h-20"
                >
                  <img
                    src={slide.src}
                    alt={`${property.title} ${index + 1}`}
                    className="h-16 w-full object-cover sm:h-20"
                    onError={(e) => {
                      e.currentTarget.src =
                        heroHouse;
                    }}
                  />
                </button>
              )
            )}
          </div>
        )}

        <div className="min-w-0 p-4 sm:p-8">

          <div className="flex min-w-0 flex-col gap-4 sm:gap-6 lg:flex-row lg:items-start lg:justify-between">

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="break-words text-2xl font-bold leading-tight sm:text-3xl lg:text-4xl">
                  {property.title}
                </h1>

                {verified && (
                  <span className="rounded-full bg-green-100 px-3 py-1 text-sm font-semibold text-green-700">
                    ✓ Verified
                  </span>
                )}
              </div>

              <p className="mt-2 break-words text-sm leading-6 text-gray-500 sm:mt-3 sm:text-base">
                📍{" "}
                {[
                  property.city,
                  property.state_province,
                  property.country,
                ]
                  .filter(Boolean)
                  .join(", ") ||
                  property.location ||
                  "Location unavailable"}
              </p>
            </div>

            <div className="w-full min-w-0 rounded-xl bg-green-600 p-4 text-center text-white sm:p-6 lg:w-auto lg:min-w-[240px]">
              <p>Price</p>

              <h2 className="break-words text-2xl font-bold sm:text-3xl">
                {property.currency || "NGN"}{" "}
                {Number(property.price || 0).toLocaleString()}
              </h2>
            </div>

          </div>

          <div className="mt-7 grid grid-cols-2 gap-3 sm:mt-10 sm:gap-4 lg:grid-cols-4">

            <div className="min-w-0 rounded-xl border p-3 text-center sm:p-4">
              <h3 className="text-xl font-bold sm:text-2xl">
                {property.bedrooms || 0}
              </h3>
              Bedrooms
            </div>

            <div className="min-w-0 rounded-xl border p-3 text-center sm:p-4">
              <h3 className="text-xl font-bold sm:text-2xl">
                {property.bathrooms || 0}
              </h3>
              Bathrooms
            </div>

            <div className="min-w-0 rounded-xl border p-3 text-center sm:p-4">
              <h3 className="break-words text-base font-bold sm:text-lg">
                {property.property_type ||
                  "Property"}
              </h3>
              Type
            </div>

            <div className="min-w-0 rounded-xl border p-3 text-center sm:p-4">
              <h3 className="break-words text-base font-bold sm:text-lg">
                {property.status || "Available"}
              </h3>
              Status
            </div>

          </div>

          <div className="mt-8 sm:mt-10">
            <h2 className="mb-3 text-xl font-bold sm:text-2xl">
              Description
            </h2>

            <p className="break-words text-sm leading-7 text-gray-600 sm:text-base sm:leading-8">
              {property.description ||
                "No description available."}
            </p>
          </div>

          {verified && (
            <div className="mt-8 min-w-0 rounded-2xl border border-green-200 bg-green-50 p-4 sm:mt-10 sm:p-6">

              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 sm:text-2xl">
                    Invest in this Property
                  </h2>

                  <p className="mt-1 text-sm leading-6 text-gray-600">
                    Submit an investment request using your
                    preferred currency. Your request will
                    appear in your Investment Dashboard.
                  </p>
                </div>

                <span className="w-fit rounded-full bg-white px-3 py-1 text-xs font-semibold text-green-700 sm:text-sm">
                  ✓ Verified Opportunity
                </span>
              </div>

              {investmentError && (
                <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                  {investmentError}
                </div>
              )}

              {investmentSuccess && (
                <div className="mt-5 rounded-xl border border-green-200 bg-white p-4 text-sm font-semibold text-green-700">
                  {investmentSuccess}
                  <div className="mt-1 font-normal text-gray-600">
                    Redirecting to your investment dashboard...
                  </div>
                </div>
              )}

              <div className="mt-5 grid gap-3 sm:mt-6 sm:gap-4 md:grid-cols-2">

                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-700">
                    Investment Amount
                  </label>

                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={investmentAmount}
                    onChange={(e) =>
                      setInvestmentAmount(
                        e.target.value
                      )
                    }
                    placeholder="Enter amount"
                    className="min-h-11 w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100 sm:text-base"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-700">
                    Investment Currency
                  </label>

                  <select
                    value={investmentCurrency}
                    onChange={(e) =>
                      setInvestmentCurrency(
                        e.target.value
                      )
                    }
                    className="min-h-11 w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100 sm:text-base"
                  >
                    <option value="NGN">
                      Nigerian Naira (NGN)
                    </option>
                    <option value="USD">
                      US Dollar (USD)
                    </option>
                    <option value="GBP">
                      British Pound (GBP)
                    </option>
                    <option value="EUR">
                      Euro (EUR)
                    </option>
                    <option value="CAD">
                      Canadian Dollar (CAD)
                    </option>
                    <option value="AUD">
                      Australian Dollar (AUD)
                    </option>
                  </select>
                </div>

              </div>

              <div className="mt-4">
                <label className="mb-2 block text-sm font-semibold text-gray-700">
                  Notes (optional)
                </label>

                <textarea
                  value={investmentNotes}
                  onChange={(e) =>
                    setInvestmentNotes(
                      e.target.value
                    )
                  }
                  rows={3}
                  placeholder="Add a note about your investment..."
                  className="min-h-11 w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100 sm:text-base"
                />
              </div>

              <div className="mt-5 rounded-xl bg-white p-4 text-sm leading-6 text-gray-600">
                <strong>How it works:</strong>

                <ol className="mt-2 list-decimal space-y-1 pl-5">
                  <li>
                    Submit your investment request.
                  </li>
                  <li>
                    Track the request from your Investment Dashboard.
                  </li>
                  <li>
                    Once available for payment, use Pay Now.
                  </li>
                  <li>
                    Complete the secure Paystack checkout.
                  </li>
                </ol>
              </div>

              <button
                type="button"
                onClick={submitInvestment}
                disabled={investmentLoading}
                className="mt-5 min-h-12 w-full rounded-xl bg-green-600 px-4 py-3.5 text-sm font-bold text-white shadow hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60 sm:mt-6 sm:px-6 sm:py-4 sm:text-base"
              >
                {investmentLoading
                  ? "Submitting Investment Request..."
                  : "Submit Investment Request"}
              </button>

              <p className="mt-3 text-center text-xs text-gray-500">
                You must be logged in to submit an investment request.
              </p>

            </div>
          )}

          {!verified && (
            <div className="mt-8 rounded-2xl border border-yellow-200 bg-yellow-50 p-4 sm:mt-10 sm:p-6">
              <h2 className="text-xl font-bold text-gray-900">
                Investment unavailable
              </h2>

              <p className="mt-2 text-sm text-gray-600">
                This property has not been verified for investment.
                Only verified properties can receive investment requests.
              </p>
            </div>
          )}

          <div className="mt-8 grid min-w-0 gap-4 sm:mt-10 sm:gap-6 lg:grid-cols-2">

            <div className="min-w-0 rounded-xl border p-4 sm:p-6">
              <h2 className="mb-3 text-lg font-bold sm:text-xl">
                Location
              </h2>

              <p className="break-words">{property.address}</p>
              <p className="break-words">{property.city}</p>
              <p className="break-words">{property.state_province}</p>
              <p className="break-words">{property.country}</p>
            </div>

            <div className="min-w-0 rounded-xl border p-4 sm:p-6">

              <h2 className="mb-4 text-xl font-bold">
                Seller Information
              </h2>

              <p className="break-words">
                <strong>Name:</strong>{" "}
                {property.owner_name ||
                  "Not Available"}
              </p>

              <p className="break-words">
                <strong>Phone:</strong>{" "}
                {property.owner_phone ||
                  "Not Available"}
              </p>

              <p className="break-words">
                <strong>Email:</strong>{" "}
                {property.owner_email ||
                  "Not Available"}
              </p>

              <button
                onClick={startChat}
                className="mt-5 min-h-12 w-full rounded-xl bg-blue-600 px-4 py-3.5 text-sm font-bold text-white hover:bg-blue-700 sm:mt-6 sm:p-4 sm:text-base"
              >
                Chat Seller
              </button>

              <button
                onClick={contactSeller}
                className="mt-3 min-h-12 w-full rounded-xl bg-green-600 px-4 py-3.5 text-sm font-bold text-white hover:bg-green-700 sm:mt-4 sm:p-4 sm:text-base"
              >
                Contact Seller
              </button>

            </div>

          </div>

        </div>
      </div>

      <Lightbox
        open={lightboxOpen}
        close={() => setLightboxOpen(false)}
        index={photoIndex}
        slides={gallerySlides}
      />

    </div>
  );
}
