export default function Biography() {
  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-10">
      <article>
        <header className="mb-8">
          <p className="mb-2 text-sm font-semibold uppercase tracking-wide">
            Personal Biography
          </p>
          <h1 className="mb-4 text-3xl font-bold sm:text-4xl">
            Kotingo Joseph (LearnMore)
          </h1>
          <p className="text-lg">
            Founder of PropertyNestHomes | Technology Entrepreneur
          </p>
        </header>

        <section className="mb-8">
          <h2 className="mb-3 text-2xl font-semibold">About Kotingo Joseph</h2>
          <p className="mb-4 leading-7">
            Kotingo Joseph, also known as LearnMore, is a technology
            entrepreneur and the founder of PropertyNestHomes, a real estate
            platform designed to help people discover properties and connect
            with property owners, sellers, and agents.
          </p>
          <p className="leading-7">
            His work on PropertyNestHomes involves developing digital
            products and online services, with features for property
            listings, communication, verification, and payment-related
            workflows.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="mb-3 text-2xl font-semibold">
            Cybersecurity and Intelligence Interests
          </h2>
          <p className="leading-7">
            Kotingo is interested in cybersecurity, digital security, and
            security intelligence. These fields focus on understanding
            digital threats, protecting information and systems, and
            analyzing information responsibly. Specific professional
            credentials, employment, or official affiliations should be
            confirmed against verifiable records.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="mb-3 text-2xl font-semibold">PropertyNestHomes</h2>
          <p className="mb-4 leading-7">
            PropertyNestHomes is his real estate technology project for
            discovering, buying, selling, and renting properties online.
          </p>
          <p>
            <a
              className="font-semibold underline"
              href="https://propertynesthomes.com/"
            >
              Visit PropertyNestHomes
            </a>
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-2xl font-semibold">Contact</h2>
          <p className="leading-7">
            For enquiries about the platform, visit the{" "}
            <a className="font-semibold underline" href="/contact">
              PropertyNestHomes contact page
            </a>.
          </p>
        </section>
      </article>
    </main>
  );
}
