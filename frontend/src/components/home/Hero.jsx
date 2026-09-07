import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import SearchBar from "./SearchBar";
import HeroSlider from "./HeroSlider";

export default function Hero() {
  return (
    <section className="relative min-h-[88dvh] overflow-hidden">
      <HeroSlider />

      {/* Professional image overlay */}
      <div className="absolute inset-0 bg-black/40" />

      <div className="absolute inset-0 bg-gradient-to-b from-black/25 via-black/20 to-black/60" />

      <div
        className="
          relative
          z-10
          mx-auto
          flex
          min-h-[88dvh]
          w-full
          max-w-7xl
          flex-col
          items-center
          justify-center
          px-4
          py-16
          text-center
          text-white
          sm:px-6
        "
      >
        <div
          className="
            mb-6
            rounded-full
            border
            border-white/30
            bg-black/20
            px-3
            py-1.5
            text-[10px]
            leading-tight
            sm:px-5
            sm:py-2
            sm:text-xs
            font-semibold
            uppercase
            tracking-widest
            backdrop-blur-md
            sm:text-sm
          "
        >
          PropertyNestHomes • Global Real Estate Marketplace
        </div>

        <h1
          className="
            w-full
            max-w-5xl
            text-3xl
            font-extrabold
            leading-tight
            drop-shadow-2xl
            sm:text-5xl
            md:text-7xl
          "
        >
          Find Exceptional Homes
          <br />
          Around The World
        </h1>

        <p
          className="
            mt-4
            w-full
            max-w-3xl
            text-sm
            font-medium
            text-gray-100
            drop-shadow-lg
            sm:mt-5
            sm:text-lg
            md:text-2xl
          "
        >
          Discover luxury homes, apartments, villas, and investment
          properties from trusted sellers.
        </p>

        <div className="mt-6 flex w-full flex-col gap-3 sm:mt-8 sm:w-auto sm:flex-row sm:gap-4">
          <Link to="/buy">
            <Button
              size="lg"
              className="w-full rounded-xl bg-green-600 px-6 font-bold hover:bg-green-700 sm:w-auto sm:px-8"
            >
              Explore Properties
            </Button>
          </Link>

          <Link to="/contact">
            <Button
              size="lg"
              variant="secondary"
              className="w-full rounded-xl px-6 font-semibold sm:w-auto sm:px-8"
            >
              Contact Expert
            </Button>
          </Link>
        </div>

        <div className="mt-6 w-full max-w-5xl sm:mt-8">
          <SearchBar />
        </div>

        <div
          className="
            mt-6
            grid
            grid-cols-2
            gap-2
            sm:mt-7
            sm:gap-3
            sm:flex
            sm:flex-wrap
            sm:justify-center
          "
        >
          {[
            "✓ Verified Listings",
            "✓ Trusted Agents",
            "✓ Secure Transactions",
            "✓ Worldwide Properties",
          ].map((item) => (
            <div
              key={item}
              className="
                rounded-full
                border
                border-white/20
                bg-black/20
                px-2.5
                py-1.5
                text-[10px]
                leading-tight
                sm:px-4
                sm:py-2
                sm:text-xs
                backdrop-blur-md
                sm:text-sm
              "
            >
              {item}
            </div>
          ))}
        </div>

        <div
          className="
            mt-7
            grid
            w-full
            grid-cols-2
            gap-3
            sm:mt-9
            sm:gap-6
            rounded-2xl
            border
            border-white/10
            bg-black/30
            px-3
            py-4
            backdrop-blur-md
            sm:px-4
            sm:py-5
            md:grid-cols-4
          "
        >
          {[
            ["✓", "Verified Property Listings"],
            ["✓", "Trusted Sellers & Agents"],
            ["✓", "Secure Property Discovery"],
            ["✓", "Local & International Homes"],
          ].map(([symbol, label]) => (
            <div key={label}>
              <h2 className="text-xl font-extrabold text-green-400 sm:text-4xl">
                {symbol}
              </h2>

              <p className="text-xs text-gray-200 sm:text-sm">
                {label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
