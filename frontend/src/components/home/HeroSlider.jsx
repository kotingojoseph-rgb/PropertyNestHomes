import { useEffect, useState } from "react";
import heroHouse from "@/assets/images/hero-house.jpg";

const slides = [
  heroHouse,
  heroHouse,
  heroHouse,
];

export default function HeroSlider() {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % slides.length);
    }, 5000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="absolute inset-0 z-0 overflow-hidden">
      {slides.map((image, index) => (
        <img
          key={index}
          src={image}
          alt={`Hero slide ${index + 1}`}
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-1000 ${
            current === index ? "opacity-100" : "opacity-0"
          }`}
        />
      ))}
    </div>
  );
}
