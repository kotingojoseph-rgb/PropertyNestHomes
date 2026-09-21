import { useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { GUIDES } from "../content/guides";

export default function GuideArticle() {
  const { slug } = useParams();
  const guide = GUIDES.find((item) => item.slug === slug);

  useEffect(() => {
    if (!guide) return;

    document.title = `${guide.title} | PropertyNestHomes`;

    let meta = document.querySelector('meta[name="description"]');

    if (!meta) {
      meta = document.createElement("meta");
      meta.setAttribute("name", "description");
      document.head.appendChild(meta);
    }

    meta.setAttribute("content", guide.description);
  }, [guide]);

  if (!guide) {
    return (
      <main className="min-h-screen bg-gray-50 px-4 py-16">
        <div className="mx-auto max-w-3xl rounded-2xl border bg-white p-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900">
            Guide not found
          </h1>

          <p className="mt-3 text-gray-600">
            The guide you requested is not available.
          </p>

          <Link
            to="/guides"
            className="mt-6 inline-flex min-h-11 items-center rounded-xl bg-green-600 px-5 py-2.5 text-sm font-semibold text-white"
          >
            Return to Property Guides
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <article className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6 sm:py-16">
        <Link
          to="/guides"
          className="text-sm font-semibold text-green-700"
        >
          ← Property Guides
        </Link>

        <header className="mt-5 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-9">
          <p className="text-sm font-semibold uppercase tracking-widest text-green-700">
            PropertyNestHomes Guide
          </p>

          <h1 className="mt-3 text-3xl font-bold leading-tight text-gray-900 sm:text-5xl">
            {guide.title}
          </h1>

          <p className="mt-5 text-base leading-8 text-gray-700 sm:text-lg">
            {guide.intro}
          </p>
        </header>

        <div className="mt-6 space-y-6">
          {guide.sections.map((section) => (
            <section
              key={section.heading}
              className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8"
            >
              <h2 className="text-2xl font-bold leading-snug text-gray-900">
                {section.heading}
              </h2>

              <div className="mt-4 space-y-4 text-base leading-8 text-gray-700">
                {section.paragraphs.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
            </section>
          ))}
        </div>

        <section className="mt-6 rounded-2xl border border-green-100 bg-green-50 p-6 sm:p-8">
          <h2 className="text-2xl font-bold text-gray-900">
            Before you commit
          </h2>

          <p className="mt-3 text-base leading-8 text-gray-700">
            PropertyNestHomes is a property discovery and communication
            platform. Always confirm current listing information and
            independently verify important ownership, legal, financial,
            inspection, and transaction details. For high-value decisions,
            use qualified professional advice appropriate to the property and
            your circumstances.
          </p>

          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              to="/buy"
              className="inline-flex min-h-11 items-center rounded-xl bg-green-600 px-5 py-2.5 text-sm font-semibold text-white"
            >
              Browse properties
            </Link>

            <Link
              to="/contact"
              className="inline-flex min-h-11 items-center rounded-xl border border-gray-300 bg-white px-5 py-2.5 text-sm font-semibold text-gray-800"
            >
              Contact us
            </Link>
          </div>
        </section>
      </article>
    </main>
  );
}
