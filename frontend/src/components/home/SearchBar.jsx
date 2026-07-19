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
    <div className="mt-12 w-full max-w-5xl rounded-2xl bg-white p-6 shadow-2xl">

      <div className="grid gap-4 md:grid-cols-4">

        <input
          type="text"
          placeholder="📍 Location"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          className="rounded-lg border p-3 outline-none"
        />

        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="rounded-lg border p-3"
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
          className="rounded-lg border p-3"
        >
          <option value="">💰 Budget</option>
          <option value="50000">$50,000</option>
          <option value="100000">$100,000</option>
          <option value="250000">$250,000</option>
          <option value="500000">$500,000+</option>
        </select>

        <Button 
          className="h-full"
          onClick={handleSearch}
        >
          🔍 Search
        </Button>

      </div>

    </div>
  );
}
