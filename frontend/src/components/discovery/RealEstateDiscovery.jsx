const websites = [
  {
    name: "PropertyPro Nigeria",
    description: "Explore houses, apartments, land, rentals and property opportunities across Nigeria.",
    url: "https://propertypro.ng/",
    category: "Nigeria",
  },
  {
    name: "Nigeria Property Centre",
    description: "Browse residential, commercial and land listings across Nigerian cities.",
    url: "https://nigeriapropertycentre.com/",
    category: "Nigeria",
  },
  {
    name: "Private Property Nigeria",
    description: "Discover houses, flats, apartments and properties for sale or rent.",
    url: "https://privateproperty.ng/",
    category: "Nigeria",
  },
];

const discoverySearches = [
  {
    label: "African real estate websites",
    query: "real estate property websites across Africa",
  },
  {
    label: "International property websites",
    query: "international property websites buy rent real estate",
  },
  {
    label: "Property investment websites",
    query: "real estate investment property websites",
  },
];

export default function RealEstateDiscovery() {
  return (
    <section className="border-y bg-white">
      <div className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 sm:py-16">
        <div className="max-w-3xl">
          <p className="text-sm font-bold uppercase tracking-widest text-green-600">
            Explore Beyond PropertyNestHomes
          </p>

          <h2 className="mt-2 text-3xl font-extrabold text-gray-900 sm:text-4xl">
            Discover Real Estate Websites
          </h2>

          <p className="mt-4 text-base leading-7 text-gray-600">
            Explore other property platforms, compare real estate opportunities
            and discover useful property resources from Nigeria and around
            the world.
          </p>
        </div>

        <div className="mt-8 grid gap-5 md:grid-cols-3">
          {websites.map((site) => (
            <article
              key={site.url}
              className="flex flex-col rounded-2xl border border-gray-200 bg-gray-50 p-6 transition hover:border-green-300 hover:shadow-md"
            >
              <span className="text-xs font-bold uppercase tracking-wider text-green-700">
                {site.category} Property Portal
              </span>

              <h3 className="mt-3 text-xl font-bold text-gray-900">
                {site.name}
              </h3>

              <p className="mt-3 flex-1 text-sm leading-6 text-gray-600">
                {site.description}
              </p>

              <a
                href={site.url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-6 inline-flex items-center justify-center rounded-xl bg-green-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-green-800"
              >
                Visit Website ↗
              </a>
            </article>
          ))}
        </div>

        <div className="mt-10 rounded-2xl border border-green-100 bg-green-50 p-6 sm:p-8">
          <h3 className="text-xl font-bold text-gray-900">
            Discover More Property Websites
          </h3>

          <p className="mt-2 text-sm leading-6 text-gray-600">
            Find additional property marketplaces and real estate resources
            through these discovery searches.
          </p>

          <div className="mt-5 flex flex-wrap gap-3">
            {discoverySearches.map((item) => (
              <a
                key={item.label}
                href={`https://www.google.com/search?q=${encodeURIComponent(item.query)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-xl border border-green-200 bg-white px-4 py-3 text-sm font-semibold text-green-800 transition hover:bg-green-100"
              >
                {item.label} ↗
              </a>
            ))}
          </div>
        </div>

        <p className="mt-6 text-xs leading-5 text-gray-500">
          External websites are independently operated. PropertyNestHomes
          does not own or guarantee their listings, services or information.
          Always verify property details independently.
        </p>
      </div>
    </section>
  );
}
