import Navbar from "@/components/common/Navbar";

function App() {
  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />

      <main className="py-24 text-center">
        <h1 className="text-5xl font-bold text-gray-900">
          Find Your Dream Home Anywhere in the World
        </h1>

        <p className="mt-6 text-xl text-gray-600">
          Buy • Sell • Rent • Invest
        </p>
      </main>
    </div>
  );
}

export default App;
