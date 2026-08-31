import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="mt-10 w-full overflow-hidden bg-gray-900 text-white sm:mt-16">
      <div className="mx-auto grid w-full min-w-0 max-w-7xl gap-8 px-4 py-9 sm:gap-10 sm:px-6 sm:py-12 md:grid-cols-3 lg:px-8">
        {/* Company */}
        <div className="min-w-0">
          <h2 className="mb-3 text-xl font-bold sm:mb-4 sm:text-2xl">
            🏡 PropertyNestHomes
          </h2>

          <p className="max-w-md text-sm leading-6 text-gray-300 sm:text-base">
            Helping buyers, sellers, and investors discover
            exceptional properties worldwide.
          </p>
        </div>

        {/* Quick Links */}
        <div className="min-w-0">
          <h3 className="mb-3 text-lg font-semibold sm:mb-4 sm:text-xl">
            Quick Links
          </h3>

          <div className="flex flex-col gap-2.5 text-sm text-gray-300 sm:gap-3 sm:text-base">
            <Link to="/" className="w-fit hover:text-white">
              Home
            </Link>

            <Link to="/buy" className="w-fit hover:text-white">
              Buy
            </Link>

            <Link to="/about" className="w-fit hover:text-white">
              About
            </Link>

            <Link to="/contact" className="w-fit hover:text-white">
              Contact
            </Link>
          </div>
        </div>

        {/* Contact */}
        <div className="min-w-0">
          <h3 className="mb-3 text-lg font-semibold sm:mb-4 sm:text-xl">
            Contact
          </h3>

          <div className="space-y-2 text-sm leading-6 text-gray-300 sm:text-base">
            <p className="break-words">
              📧{" "}
              <a
                href="mailto:Propertynesthomes.app@gmail.com"
                className="break-all text-blue-400 hover:underline"
              >
                Propertynesthomes.app@gmail.com
              </a>
            </p>

            <p>
              📞{" "}
              <a
                href="tel:+2349068936306"
                className="text-blue-400 hover:underline"
              >
                +234 906 893 6306
              </a>
            </p>

            <p>📍 Lagos, Nigeria</p>
          </div>
        </div>
      </div>

      <div className="border-t border-gray-700 px-4 py-4 text-center text-xs leading-5 text-gray-400 sm:px-6 sm:py-5 sm:text-sm">
        © 2026 PropertyNestHomes. All Rights Reserved.
      </div>
    </footer>
  );
}
