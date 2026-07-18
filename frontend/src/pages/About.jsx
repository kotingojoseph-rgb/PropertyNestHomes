export default function About() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-16">

      <h1 className="mb-8 text-5xl font-bold text-blue-900">
        About PropertyNestHomes
      </h1>

      <p className="mb-10 text-lg text-gray-700">
        PropertyNestHomes is a modern real estate platform connecting
        buyers, sellers, landlords, investors, and trusted real estate
        professionals across the world.
      </p>

      <div className="grid gap-8 md:grid-cols-2">

        <div className="rounded-xl border p-8 shadow-sm">
          <h2 className="mb-4 text-2xl font-bold">
            Our Mission
          </h2>

          <p className="text-gray-600">
            To make buying, selling, and managing properties simple,
            secure, transparent, and accessible for everyone.
          </p>
        </div>

        <div className="rounded-xl border p-8 shadow-sm">
          <h2 className="mb-4 text-2xl font-bold">
            Why Choose Us?
          </h2>

          <ul className="space-y-3 text-gray-600">
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
