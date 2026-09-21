import { Link } from "react-router-dom";
import { GUIDES } from "../content/guides";

export default function Guides() {
  return (
    <main className="min-h-screen bg-gray-50">
      <section className="border-b bg-white">
        <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
          <p className="text-sm font-semibold uppercase tracking-widest text-green-700">
            PropertyNestHomes Guides
          </p>

          <h1 className="mt-3 max-w-4xl text-3xl font-bold leading-tight text-gray-900 sm:text-5xl">
            Practical property guides for buyers, renters, and sellers
          </h1>

          <p className="mt-5 max-w-4xl text-base leading-8 text-gray-700 sm:text-lg">
            These guides explain practical steps for researching property,
            comparing listings, communicating with property contacts,
            inspecting properties, and carrying out important checks before a
            major commitment.
          </p>

          <div className="mt-10 grid gap-6 md:grid-cols-2">
            {GUIDES.map((guide) => (
              <article
                key={guide.slug}
                className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
              >
                <h2 className="text-xl font-bold leading-snug text-gray-900">
                  {guide.title}
                </h2>

                <p className="mt-3 text-base leading-7 text-gray-700">
                  {guide.description}
                </p>

                <Link
                  to={`/guides/${guide.slug}`}
                  className="mt-5 inline-flex min-h-11 items-center rounded-xl bg-green-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-green-700"
                >
                  Read guide →
                </Link>
              </article>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
