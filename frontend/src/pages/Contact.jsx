import { useState } from "react";

const API_URL = import.meta.env.VITE_API_URL;

export default function Contact() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    message: "",
  });

  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));

    setError("");
    setSuccess("");
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setError("");
    setSuccess("");

    const name = form.name.trim();
    const email = form.email.trim();
    const message = form.message.trim();

    if (!name || !email || !message) {
      setError("Please complete all fields.");
      return;
    }

    if (name.length > 100) {
      setError("Your name is too long.");
      return;
    }

    if (message.length > 5000) {
      setError("Your message is too long.");
      return;
    }

    setSending(true);

    try {
      const response = await fetch(
        `${API_URL}/api/contact`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name,
            email,
            message,
          }),
        }
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data?.error ||
            "Unable to send your message."
        );
      }

      setSuccess(
        "Thank you. Your message has been sent successfully."
      );

      setForm({
        name: "",
        email: "",
        message: "",
      });
    } catch (err) {
      console.error(
        "Contact form error:",
        err
      );

      setError(
        err.message ||
          "Unable to send your message right now. Please try again later."
      );
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-6xl min-w-0 px-4 py-10 sm:px-6 sm:py-16">
      <div className="mx-auto max-w-3xl text-center">
        <h1 className="mb-6 w-full min-w-0 break-words text-2xl font-bold leading-tight text-blue-900 sm:text-4xl md:text-5xl">
          Contact PropertyNestHomes
        </h1>

        <p className="mb-12 text-lg leading-8 text-gray-700">
          We'd love to hear from you. Whether you're
          buying, selling, investing, or just have a
          question, our team is here to help.
        </p>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        <div className="min-w-0 rounded-xl border bg-white p-5 shadow-sm sm:p-8">
          <h2 className="mb-6 text-2xl font-bold text-gray-900">
            Contact Information
          </h2>

          <div className="space-y-5 text-gray-700">
            <p>
              <strong>Email:</strong>{" "}
              <a
                href="mailto:Propertynesthomes.app@gmail.com"
                className="text-blue-700 hover:underline"
              >
                Propertynesthomes.app@gmail.com
              </a>
            </p>

            <p>
              <strong>Phone:</strong>{" "}
              <a
                href="tel:+2349068936306"
                className="text-blue-700 hover:underline"
              >
                +234 906 893 6306
              </a>
            </p>

            <p>
              <strong>Office:</strong> Lagos, Nigeria
            </p>
          </div>
        </div>

        <div className="min-w-0 rounded-xl border bg-white p-5 shadow-sm sm:p-8">
          <h2 className="mb-6 text-2xl font-bold text-gray-900">
            Send Us a Message
          </h2>

          <form
            onSubmit={handleSubmit}
            className="space-y-4"
          >
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="Your Name"
              maxLength={100}
              autoComplete="name"
              disabled={sending}
              className="w-full rounded-lg border p-3 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 disabled:bg-gray-100"
            />

            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="Your Email"
              maxLength={254}
              autoComplete="email"
              disabled={sending}
              className="w-full rounded-lg border p-3 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 disabled:bg-gray-100"
            />

            <textarea
              name="message"
              value={form.message}
              onChange={handleChange}
              placeholder="Your Message"
              rows={6}
              maxLength={5000}
              disabled={sending}
              className="w-full resize-y rounded-lg border p-3 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 disabled:bg-gray-100"
            />

            {error && (
              <div
                role="alert"
                className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"
              >
                {error}
              </div>
            )}

            {success && (
              <div
                role="status"
                className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700"
              >
                {success}
              </div>
            )}

            <button
              type="submit"
              disabled={sending}
              className="w-full rounded-lg bg-blue-700 px-6 py-3 font-medium text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {sending
                ? "Sending..."
                : "Send Message"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
