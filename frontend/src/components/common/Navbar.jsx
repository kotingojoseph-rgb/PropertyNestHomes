import { Link } from "react-router-dom";

export default function Navbar() {
  return (
    <nav className="bg-white border-b p-4">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <h1 className="text-2xl font-bold">PropertyNestHomes</h1>

        <div className="space-x-6">
          <Link to="/">Home</Link>
          <Link to="/buy">Buy</Link>
        </div>
      </div>
    </nav>
  );
}
