import { Button } from "@/components/ui/button";

export default function SearchBar() {
  return (
    <div className="mt-12 w-full max-w-5xl rounded-2xl bg-white p-6 shadow-2xl">

      <div className="grid gap-4 md:grid-cols-4">

        <input
          type="text"
          placeholder="📍 Location"
          className="rounded-lg border p-3 outline-none"
        />

        <select className="rounded-lg border p-3">
          <option>🏠 Property Type</option>
          <option>House</option>
          <option>Apartment</option>
          <option>Land</option>
          <option>Office</option>
        </select>

        <select className="rounded-lg border p-3">
          <option>💰 Budget</option>
          <option>$50,000</option>
          <option>$100,000</option>
          <option>$250,000</option>
          <option>$500,000+</option>
        </select>

        <Button className="h-full">
          🔍 Search
        </Button>

      </div>

    </div>
  );
}
