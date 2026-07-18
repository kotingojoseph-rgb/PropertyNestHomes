export default function Contact() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-16">
      <h1 className="mb-8 text-5xl font-bold text-blue-900">
        Contact PropertyNestHomes
      </h1>

      <p className="mb-10 text-lg text-gray-700">
        We'd love to hear from you. Whether you're buying, selling,
        investing, or just have a question, our team is here to help.
      </p>

      <div className="grid gap-8 md:grid-cols-2">

        <div className="rounded-xl border p-8 shadow-sm">
          <h2 className="mb-4 text-2xl font-bold">Contact Information</h2>

          <p><strong>Email:</strong> info@propertynesthomes.com</p>
          <p><strong>Phone:</strong> +234 800 000 0000</p>
          <p><strong>Office:</strong> Lagos, Nigeria</p>
        </div>

        <div className="rounded-xl border p-8 shadow-sm">
          <h2 className="mb-4 text-2xl font-bold">Send Us a Message</h2>

          <input
            type="text"
            placeholder="Your Name"
            className="mb-4 w-full rounded border p-3"
          />

          <input
            type="email"
            placeholder="Your Email"
            className="mb-4 w-full rounded border p-3"
          />

          <textarea
            placeholder="Your Message"
            rows="5"
            className="mb-4 w-full rounded border p-3"
          ></textarea>

          <button className="rounded bg-blue-700 px-6 py-3 text-white hover:bg-blue-800">
            Send Message
          </button>
        </div>

      </div>
    </div>
  );
}
