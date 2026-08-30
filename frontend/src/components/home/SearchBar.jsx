import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function SearchBar() {
  const navigate = useNavigate();

  const [location, setLocation] = useState("");
  const [type, setType] = useState("");
  const [budget, setBudget] = useState("");

  const handleSearch = () => {
    navigate(
      `/buy?location=${location}&type=${type}&budget=${budget}`
    );
  };

  return (
    <div className="mt-7 w-full max-w-5xl rounded-2xl bg-white p-3 shadow-2xl sm:mt-12 sm:p-6">

      <div className="grid gap-3 sm:gap-4 md:grid-cols-4">

        <input
          type="text"
          placeholder="📍 Location"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          className="min-h-11 w-full rounded-lg border px-3 py-3 text-sm outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100 sm:text-base"
        />

        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="min-h-11 w-full rounded-lg border px-3 py-3 text-sm sm:text-base"
        >
          <option value="">🏠 Property Type</option>
          <option value="House">House</option>
          <option value="Apartment">Apartment</option>
          <option value="Land">Land</option>
          <option value="Office">Office</option>
        </select>

        <select
          value={budget}
          onChange={(e) => setBudget(e.target.value)}
          className="min-h-11 w-full rounded-lg border px-3 py-3 text-sm sm:text-base"
        >
          <option value="">💰 Budget</option>
          <option value="50000">$50,000</option>
          <option value="100000">$100,000</option>
          <option value="250000">$250,000</option>
          <option value="500000">$500,000+</option>
        </select>

        <Button 
          className="min-h-11 h-full w-full rounded-lg"
          onClick={handleSearch}
        >
          🔍 Search
        </Button>

      </div>

    </div>
  );
}
