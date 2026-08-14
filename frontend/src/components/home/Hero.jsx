import { Button } from "@/components/ui/button";
import SearchBar from "./SearchBar";
import HeroSlider from "./HeroSlider";

export default function Hero() {
  return (
    <section className="relative min-h-[88vh] overflow-hidden">
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
          min-h-[88vh]
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
            px-5
            py-2
            text-xs
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
            max-w-5xl
            text-4xl
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
            mt-5
            max-w-3xl
            text-base
            font-medium
            text-gray-100
            drop-shadow-lg
            sm:text-lg
            md:text-2xl
          "
        >
          Discover luxury homes, apartments, villas, and investment
          properties from trusted sellers.
        </p>

        <div className="mt-8 flex flex-col gap-4 sm:flex-row">
          <Button
            size="lg"
            className="rounded-xl bg-green-600 px-8 font-bold hover:bg-green-700"
          >
            Explore Properties
          </Button>

          <Button
            size="lg"
            variant="secondary"
            className="rounded-xl px-8 font-semibold"
          >
            Contact Expert
          </Button>
        </div>

        <div className="mt-8 w-full max-w-5xl">
          <SearchBar />
        </div>

        <div
          className="
            mt-7
            grid
            grid-cols-2
            gap-3
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
                px-4
                py-2
                text-xs
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
            mt-9
            grid
            w-full
            grid-cols-2
            gap-6
            rounded-2xl
            border
            border-white/10
            bg-black/30
            px-4
            py-5
            backdrop-blur-md
            md:grid-cols-4
          "
        >
          {[
            ["18K+", "Properties Listed"],
            ["95+", "Countries Covered"],
            ["4,300+", "Verified Agents"],
            ["$38B+", "Property Value"],
          ].map(([number, label]) => (
            <div key={label}>
              <h2 className="text-2xl font-extrabold text-green-400 sm:text-4xl">
                {number}
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
