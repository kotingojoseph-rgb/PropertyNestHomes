import Hero from "@/components/home/Hero";
import FeaturedProperties from "@/components/home/FeaturedProperties";
import BannerAd from "@/components/ads/BannerAd";

export default function Home() {
  return (
    <>
      <Hero />

      <FeaturedProperties />

      <section className="bg-white border-y">
        <div className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 sm:py-16">
          <div className="max-w-4xl">
            <p className="text-sm font-bold uppercase tracking-widest text-green-600">
              Real Estate Marketplace
            </p>

            <h2 className="mt-2 text-3xl font-extrabold leading-tight text-gray-900 sm:text-4xl">
              Discover properties with the information you need
            </h2>

            <p className="mt-5 text-base leading-8 text-gray-700 sm:text-lg">
              PropertyNestHomes brings property discovery and real estate
              connections together in one platform. Buyers and renters can
              explore available homes, apartments, villas, duplexes, and other
              property listings, while sellers, landlords, and real estate
              professionals can present properties to people actively looking
              for real estate.
            </p>

            <p className="mt-4 text-base leading-8 text-gray-700 sm:text-lg">
              Property listings can include important details such as price,
              location, property type, bedrooms, bathrooms, size, images, and
              listing status. Reviewing these details can help visitors narrow
              their search before contacting the person responsible for a
              property.
            </p>
          </div>

          <div className="mt-10 grid gap-6 md:grid-cols-3">
            <article className="rounded-2xl border bg-gray-50 p-6">
              <h3 className="text-xl font-bold text-gray-900">
                Find a Property
              </h3>
              <p className="mt-3 text-base leading-7 text-gray-700">
                Browse available listings and compare property information
                based on your needs. Use the property search experience to
                explore homes and other real estate opportunities.
              </p>
            </article>

            <article className="rounded-2xl border bg-gray-50 p-6">
              <h3 className="text-xl font-bold text-gray-900">
                List a Property
              </h3>
              <p className="mt-3 text-base leading-7 text-gray-700">
                Sellers, landlords, and authorized real estate professionals
                can present properties with relevant information so potential
                buyers and renters can understand the opportunity before
                making contact.
              </p>
            </article>

            <article className="rounded-2xl border bg-gray-50 p-6">
              <h3 className="text-xl font-bold text-gray-900">
                Connect With Property Contacts
              </h3>
              <p className="mt-3 text-base leading-7 text-gray-700">
                When a property is of interest, users can use the available
                communication features to connect with the relevant property
                contact and continue their discussion.
              </p>
            </article>
          </div>
        </div>
      </section>

      <section className="bg-gray-50">
        <div className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 sm:py-16">
          <div className="grid gap-8 lg:grid-cols-2">
            <article className="rounded-2xl bg-white p-6 shadow-sm sm:p-8">
              <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl">
                Buying or renting a property
              </h2>

              <p className="mt-4 text-base leading-7 text-gray-700">
                Start by identifying the type of property, location, budget,
                and features that matter to you. Review listing information
                carefully and compare suitable properties before contacting a
                seller, landlord, or agent.
              </p>

              <p className="mt-4 text-base leading-7 text-gray-700">
                PropertyNestHomes is designed to make the discovery and
                communication stages easier. However, visitors should always
                independently verify ownership, pricing, availability,
                property condition, legal status, and other important details
                before entering into a transaction or rental agreement.
              </p>
            </article>

            <article className="rounded-2xl bg-white p-6 shadow-sm sm:p-8">
              <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl">
                Selling or managing property
              </h2>

              <p className="mt-4 text-base leading-7 text-gray-700">
                A useful property listing should give potential buyers or
                renters enough information to understand what is being offered.
                Clear descriptions, accurate pricing, relevant property
                details, current images, and the correct location can help
                visitors evaluate a listing more effectively.
              </p>

              <p className="mt-4 text-base leading-7 text-gray-700">
                Property owners and authorized representatives are responsible
                for the accuracy of the information they publish and for
                ensuring that they have the appropriate authority to advertise
                a property.
              </p>
            </article>
          </div>
        </div>
      </section>

      <BannerAd />
    </>
  );
}
