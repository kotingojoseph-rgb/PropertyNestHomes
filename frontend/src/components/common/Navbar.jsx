import { Home, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Navbar() {
  return (
    <header className="w-full border-b bg-white shadow-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">

        <div className="flex items-center gap-2">
          <Home className="h-8 w-8 text-green-600" />
          <span className="text-2xl font-bold text-gray-900">
            PropertyNestHomes
          </span>
        </div>

        <nav className="hidden md:flex items-center gap-8 text-gray-700 font-medium">
          <a href="#">Home</a>
          <a href="#">Buy</a>
          <a href="#">Rent</a>
          <a href="#">Sell</a>
          <a href="#">About</a>
        </nav>

        <div className="hidden md:flex gap-3">
          <Button variant="outline">Login</Button>
          <Button>Register</Button>
        </div>

        <button className="md:hidden">
          <Menu className="h-7 w-7" />
        </button>

      </div>
    </header>
  );
}
