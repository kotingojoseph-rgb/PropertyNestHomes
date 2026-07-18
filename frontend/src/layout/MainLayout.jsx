import Navbar from "../components/common/Navbar";
import Footer from "../components/common/Footer";

export default function MainLayout({ children }) {
  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-gray-50 flex flex-col">

      <Navbar />

      <main
        className="
        flex-1
        w-full
        max-w-screen-xl
        mx-auto
        px-4
        sm:px-6
        lg:px-8
        "
      >
        {children}
      </main>

      <Footer />

    </div>
  );
}
