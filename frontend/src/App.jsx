import { Routes, Route } from "react-router-dom";

import Navbar from "./components/common/Navbar";
import Home from "./pages/Home";
import Buy from "./pages/Buy";
import PropertyDetails from "./pages/PropertyDetails";
import Dashboard from "./pages/Dashboard";

export default function App() {
  return (
    <>
      <Navbar />

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/buy" element={<Buy />} />
  <Route path="/property/:id" element={<PropertyDetails />} />
<Route path="/dashboard" element={<Dashboard />} />    

  </Routes>
    </>
  );
}
