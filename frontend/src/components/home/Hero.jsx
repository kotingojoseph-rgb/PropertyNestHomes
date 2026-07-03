import { Button } from "@/components/ui/button";
import heroHouse from "@/assets/images/hero-house.jpg";

import SearchBar from "./SearchBar";

export default function Hero() {
  return (
    <section
  className="relative min-h-[120vh] bg-cover bg-center"
     
      style={{
        backgroundImage: `url(${heroHouse})`,
      }}
    >
      {/* Dark Overlay */}
      <div className="absolute inset-0 bg-black/60"></div>

      {/* Content */}
      <div className="relative z-10 mx-auto flex min-h-[120vh] max-w-7xl flex-col items-center justify-center px-6 text-center text-white">

        <h1 className="max-w-5xl text-5xl font-bold leading-tight md:text-6xl">
          Luxury Living Begins Here
        </h1>

        <p className="mt-8 max-w-3xl text-lg text-gray-200 md:text-2xl">
          Discover exceptional homes, luxury apartments, villas, and
          investment properties from trusted real estate professionals
          around the world.
        </p>

        <div className="mt-10 flex flex-wrap justify-center gap-4">
          <Button size="lg">
            Explore Properties
          </Button>

          <Button size="lg" variant="secondary">
            Contact an Expert
          </Button>
        </div>

        <SearchBar />

        <div className="mt-10 grid grid-cols-2 gap-8 text-center md:mt-14 md:grid-cols-4">

          <div>
            <h2 className="text-5xl font-bold text-green-400">
              18K+
            </h2>
            <p className="mt-2 text-gray-300">
              Properties Listed
            </p>
          </div>

          <div>
            <h2 className="text-5xl font-bold text-green-400">
              95+
            </h2>
            <p className="mt-2 text-gray-300">
              Countries Covered
            </p>
          </div>

          <div>
            <h2 className="text-5xl font-bold text-green-400">
              4,300+
            </h2>
            <p className="mt-2 text-gray-300">
              Verified Agents
            </p>
          </div>

          <div>
            <h2 className="text-5xl font-bold text-green-400">
              $38B+
            </h2>
            <p className="mt-2 text-gray-300">
              Property Value
            </p>
          </div>

        </div>

      </div>
    </section>
  );
}
