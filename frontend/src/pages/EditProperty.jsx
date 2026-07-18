
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

export default function EditProperty() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    price: "",
    currency: "USD",
    country: "",
    state_province: "",
    city: "",
    address: "",
    postal_code: "",
    bedrooms: "",
    bathrooms: "",
    property_type: "House",
    status: "For Sale",
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProperty();
  }, []);

  const fetchProperty = async () => {
    try {
      const token = localStorage.getItem("token");

      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/properties/${id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await res.json();

      setFormData(data.property || data);
      setLoading(false);

    } catch (err) {
      console.error(err);
      alert("Unable to load property");
    }
  };


  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };


  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const token = localStorage.getItem("token");

      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/properties/${id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(formData),
        }
      );


      const data = await res.json();

      if (!res.ok) {
        alert(data.message || "Update failed");
        return;
      }


      alert("Property updated successfully");

      navigate("/dashboard");


    } catch (err) {
      console.error(err);
      alert("Something went wrong");
    }
  };


  if (loading) {
    return (
      <div className="text-center py-20">
        Loading property...
      </div>
    );
  }


  return (
    <div className="max-w-6xl mx-auto px-6 py-12">

      <div className="mb-10">

        <h1 className="text-4xl font-bold">
          Edit Property
        </h1>

        <p className="text-gray-500 mt-2">
          Update your property information.
        </p>

      </div>


      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-2xl shadow-lg p-8 space-y-8"
      >

        <div className="grid md:grid-cols-2 gap-6">

          <input
            name="title"
            placeholder="Property Title"
            value={formData.title || ""}
            onChange={handleChange}
            className="border rounded-lg p-4"
            required
          />


          <input
            name="price"
            placeholder="Price"
            value={formData.price || ""}
            onChange={handleChange}
            className="border rounded-lg p-4"
            required
          />

        </div>


        <textarea
          name="description"
          rows="5"
          placeholder="Property Description"
          value={formData.description || ""}
          onChange={handleChange}
          className="w-full border rounded-lg p-4"
        />


        <div className="grid md:grid-cols-3 gap-6">

          <input
            name="country"
            placeholder="Country"
            value={formData.country || ""}
            onChange={handleChange}
            className="border rounded-lg p-4"
          />

          <input
            name="state_province"
            placeholder="State / Province"
            value={formData.state_province || ""}
            onChange={handleChange}
            className="border rounded-lg p-4"
          />

          <input
            name="city"
            placeholder="City"
            value={formData.city || ""}
            onChange={handleChange}
            className="border rounded-lg p-4"
          />

        </div>


        <div className="grid md:grid-cols-2 gap-6">

          <input
            name="address"
            placeholder="Street Address"
            value={formData.address || ""}
            onChange={handleChange}
            className="border rounded-lg p-4"
          />


          <input
            name="postal_code"
            placeholder="Postal Code"
            value={formData.postal_code || ""}
            onChange={handleChange}
            className="border rounded-lg p-4"
          />

        </div>


        <div className="grid md:grid-cols-4 gap-6">

          <input
            name="currency"
            placeholder="Currency"
            value={formData.currency || ""}
            onChange={handleChange}
            className="border rounded-lg p-4"
          />

          <input
            name="bedrooms"
            placeholder="Bedrooms"
            value={formData.bedrooms || ""}
            onChange={handleChange}
            className="border rounded-lg p-4"
          />

          <input
            name="bathrooms"
            placeholder="Bathrooms"
            value={formData.bathrooms || ""}
            onChange={handleChange}
            className="border rounded-lg p-4"
          />


          <input
            name="property_type"
            placeholder="Property Type"
            value={formData.property_type || ""}
            onChange={handleChange}
            className="border rounded-lg p-4"
          />

        </div>


        <div className="grid md:grid-cols-2 gap-6">

          <input
            name="status"
            placeholder="Status"
            value={formData.status || ""}
            onChange={handleChange}
            className="border rounded-lg p-4"
          />


          <button
            type="submit"
            className="bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold text-lg"
          >
            Update Property
          </button>

        </div>


      </form>

    </div>
  );
}
