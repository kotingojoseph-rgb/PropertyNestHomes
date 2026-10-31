const websites = [
  {
    name: "PropertyPro Nigeria",
    country: "Nigeria",
    description: "Explore houses, apartments, land and rentals across Nigeria.",
    url: "https://propertypro.ng/",
  },
  {
    name: "Nigeria Property Centre",
    country: "Nigeria",
    description: "Browse residential, commercial and land listings across Nigeria.",
    url: "https://nigeriapropertycentre.com/",
  },
  {
    name: "Private Property Nigeria",
    country: "Nigeria",
    description: "Discover properties for sale and rent in Nigeria.",
    url: "https://privateproperty.ng/",
  },
  {
    name: "Meqasa",
    country: "Ghana",
    description: "Explore houses, apartments and property opportunities in Ghana.",
    url: "https://meqasa.com/",
  },
  {
    name: "BuyRentKenya",
    country: "Kenya",
    description: "Discover property listings and rentals across Kenya.",
    url: "https://www.buyrentkenya.com/",
  },
  {
    name: "Property24 South Africa",
    country: "South Africa",
    description: "Explore homes, apartments and commercial properties.",
    url: "https://www.property24.com/",
  },
  {
    name: "Private Property South Africa",
    country: "South Africa",
    description: "Browse properties for sale and rent in South Africa.",
    url: "https://www.privateproperty.co.za/",
  },
  {
    name: "Rightmove",
    country: "United Kingdom",
    description: "Explore homes and property listings across the UK.",
    url: "https://www.rightmove.co.uk/",
  },
  {
    name: "Zoopla",
    country: "United Kingdom",
    description: "Discover UK homes, property prices and rental listings.",
    url: "https://www.zoopla.co.uk/",
  },
  {
    name: "Zillow",
    country: "United States",
    description: "Explore homes, rentals and property information in the USA.",
    url: "https://www.zillow.com/",
  },
  {
    name: "Realtor.com",
    country: "United States",
    description: "Browse homes for sale and rent across the United States.",
    url: "https://www.realtor.com/",
  },
  {
    name: "Bayut",
    country: "United Arab Emirates",
    description: "Explore properties for sale and rent in the UAE.",
    url: "https://www.bayut.com/",
  },
  {
    name: "Property Finder",
    country: "United Arab Emirates",
    description: "Discover homes and property opportunities in the UAE.",
    url: "https://www.propertyfinder.ae/",
  },
];

const countries = [
  "Nigeria",
  "Ghana",
  "Kenya",
  "South Africa",
  "United Kingdom",
  "United States",
  "United Arab Emirates",
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
            Discover Real Estate Websites Worldwide
          </h2>

          <p className="mt-4 text-base leading-7 text-gray-600">
            Explore independent real estate marketplaces from different
            countries. Compare property opportunities and visit other
            property websites directly.
          </p>
        </div>

        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {websites.map((site) => (
            <article
              key={site.url}
              className="flex flex-col rounded-2xl border border-gray-200 bg-gray-50 p-6 transition hover:border-green-300 hover:shadow-md"
            >
              <span className="text-xs font-bold uppercase tracking-wider text-green-700">
                {site.country} Property Portal
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
            Find More Property Websites
          </h3>

          <p className="mt-2 text-sm leading-6 text-gray-600">
            Search for additional real estate marketplaces and property
            resources in these countries.
          </p>

          <div className="mt-5 flex flex-wrap gap-3">
            {countries.map((country) => (
              <a
                key={country}
                href={`https://www.google.com/search?q=${encodeURIComponent(
                  `real estate websites property portals ${country}`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-xl border border-green-200 bg-white px-4 py-3 text-sm font-semibold text-green-800 transition hover:bg-green-100"
              >
                Explore {country} ↗
              </a>
            ))}
          </div>
        </div>

        <p className="mt-6 text-xs leading-5 text-gray-500">
          External websites are independently operated and are not owned
          or endorsed by PropertyNestHomes. Their availability, listings
          and services may change. Always verify property details independently.
        </p>
      </div>
    </section>
  );
}
