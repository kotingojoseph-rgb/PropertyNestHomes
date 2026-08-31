export default function About() {
  return (
    <div className="mx-auto w-full max-w-6xl min-w-0 px-4 py-10 sm:px-6 sm:py-16">
      <h1 className="mb-6 break-words text-3xl font-bold leading-tight text-blue-900 sm:mb-8 sm:text-5xl">
        About PropertyNestHomes
      </h1>

      <p className="mb-8 max-w-5xl break-words text-base leading-7 text-gray-700 sm:mb-10 sm:text-lg sm:leading-8">
        PropertyNestHomes is a modern real estate platform connecting
        buyers, sellers, landlords, investors, and trusted real estate
        professionals across the world.
      </p>

      <div className="grid min-w-0 grid-cols-1 gap-5 sm:gap-8 md:grid-cols-2">
        <div className="min-w-0 rounded-xl border bg-white p-5 shadow-sm sm:p-8">
          <h2 className="mb-4 break-words text-xl font-bold sm:text-2xl">
            Our Mission
          </h2>

          <p className="break-words text-base leading-7 text-gray-600 sm:text-lg sm:leading-8">
            To make buying, selling, and managing properties simple,
            secure, transparent, and accessible for everyone.
          </p>
        </div>

        <div className="min-w-0 rounded-xl border bg-white p-5 shadow-sm sm:p-8">
          <h2 className="mb-4 break-words text-xl font-bold sm:text-2xl">
            Why Choose Us?
          </h2>

          <ul className="space-y-3 break-words text-base leading-6 text-gray-600 sm:text-lg">
            <li>✅ Verified Property Listings</li>
            <li>✅ Trusted Real Estate Professionals</li>
            <li>✅ Worldwide Property Listings</li>
            <li>✅ Secure Property Transactions</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
