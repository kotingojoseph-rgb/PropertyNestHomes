import { useEffect, useState } from "react";

import luxuryHome from "@/assets/images/properties/luxury-home.jpg";
import modernVilla from "@/assets/images/properties/modern-villa.jpg";
import modernHouse from "@/assets/images/properties/modern-house.jpg";

const slides = [
  luxuryHome,
  modernVilla,
  modernHouse,
];

export default function HeroSlider() {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % slides.length);
    }, 6000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="absolute inset-0 z-0 overflow-hidden">
      {slides.map((image, index) => (
        <img
          key={image}
          src={image}
          alt={`Luxury property ${index + 1}`}
          className={`absolute inset-0 h-full w-full object-cover transition-all duration-1000 ${
            current === index
              ? "scale-100 opacity-100"
              : "scale-105 opacity-0"
          }`}
        />
      ))}
    </div>
  );
}
