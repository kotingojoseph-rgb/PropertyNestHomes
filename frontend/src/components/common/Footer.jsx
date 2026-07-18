import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-white mt-16">

      <div className="mx-auto grid max-w-7xl gap-10 px-6 py-12 md:grid-cols-3">

        {/* Company */}
        <div>
          <h2 className="mb-4 text-2xl font-bold">
            🏡 PropertyNestHomes
          </h2>

          <p className="text-gray-300">
            Helping buyers, sellers, and investors discover
            exceptional properties worldwide.
          </p>
        </div>


        {/* Quick Links */}
        <div>
          <h3 className="mb-4 text-xl font-semibold">
            Quick Links
          </h3>

          <div className="flex flex-col gap-3 text-gray-300">

            <Link to="/">
              Home
            </Link>

            <Link to="/buy">
              Buy
            </Link>

            <Link to="/about">
              About
            </Link>

            <Link to="/contact">
              Contact
            </Link>

          </div>
        </div>


        {/* Contact */}
        <div>
          <h3 className="mb-4 text-xl font-semibold">
            Contact
          </h3>

          <p className="text-gray-300">
            📧 info@propertynesthomes.com
          </p>

          <p className="mt-2 text-gray-300">
            📞 +234 800 000 0000
          </p>

          <p className="mt-2 text-gray-300">
            📍 Lagos, Nigeria
          </p>

        </div>

      </div>


      <div className="border-t border-gray-700 py-5 text-center text-gray-400">

        © 2026 PropertyNestHomes. All Rights Reserved.

      </div>

    </footer>
  );
}
