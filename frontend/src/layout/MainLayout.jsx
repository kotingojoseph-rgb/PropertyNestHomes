import Navbar from "../components/common/Navbar";
import Footer from "../components/common/Footer";

export default function MainLayout({ children }) {
  return (
    <div className="flex min-h-[100dvh] w-full min-w-0 flex-col overflow-x-hidden bg-gray-50">
      <Navbar />

      <main
        className="
          min-w-0
          w-full
          flex-1
          max-w-screen-xl
          mx-auto
          px-3
          py-3
          sm:px-6
          sm:py-5
          lg:px-8
          lg:py-6
        "
      >
        {children}
      </main>

      <Footer />
    </div>
  );
}
