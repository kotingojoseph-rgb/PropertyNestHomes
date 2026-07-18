
import { useState } from "react";

export default function PropertyForm({
  initialData,
  submitText,
  onSubmit,
}) {
  const [formData, setFormData] = useState(initialData);

  function handleChange(e) {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  }

  function submit(e) {
    e.preventDefault();
    onSubmit(formData);
  }

  return (
    <form
      onSubmit={submit}
      className="space-y-6"
    >
      <div>
        <label className="mb-2 block font-semibold">
          Property Title
        </label>

        <input
          name="title"
          value={formData.title}
          onChange={handleChange}
          placeholder="Luxury Apartment"
          className="w-full rounded-lg border p-3"
        />
      </div>

      <div>
        <label className="mb-2 block font-semibold">
          Description
        </label>

        <textarea
          name="description"
          rows={5}
          value={formData.description}
          onChange={handleChange}
          className="w-full rounded-lg border p-3"
        />
      </div>

      <div className="grid gap-5 md:grid-cols-2">

        <div>
          <label className="mb-2 block font-semibold">
            Price
          </label>

          <input
            name="price"
            value={formData.price}
            onChange={handleChange}
            className="w-full rounded-lg border p-3"
          />
        </div>

        <div>
          <label className="mb-2 block font-semibold">
            Currency
          </label>

          <select
            name="currency"
            value={formData.currency}
            onChange={handleChange}
            className="w-full rounded-lg border p-3"
          >
            <option>USD</option>
            <option>NGN</option>
            <option>EUR</option>
            <option>GBP</option>
            <option>CAD</option>
          </select>
        </div>

      </div>

      <div className="grid gap-5 md:grid-cols-2">

        <input
          name="country"
          placeholder="Country"
          value={formData.country}
          onChange={handleChange}
          className="rounded-lg border p-3"
        />

        <input
          name="state_province"
          placeholder="State / Province"
          value={formData.state_province}
          onChange={handleChange}
          className="rounded-lg border p-3"
        />

        <input
          name="city"
          placeholder="City"
          value={formData.city}
          onChange={handleChange}
          className="rounded-lg border p-3"
        />

        <input
          name="postal_code"
          placeholder="Postal Code"
          value={formData.postal_code}
          onChange={handleChange}
          className="rounded-lg border p-3"
        />

      </div>

      <input
        name="address"
        placeholder="Street Address"
        value={formData.address}
        onChange={handleChange}
        className="w-full rounded-lg border p-3"
      />

      <div className="grid gap-5 md:grid-cols-2">

        <input
          name="bedrooms"
          placeholder="Bedrooms"
          value={formData.bedrooms}
          onChange={handleChange}
          className="rounded-lg border p-3"
        />

        <input
          name="bathrooms"
          placeholder="Bathrooms"
          value={formData.bathrooms}
          onChange={handleChange}
          className="rounded-lg border p-3"
        />

      </div>

      <div className="grid gap-5 md:grid-cols-2">

        <select
          name="property_type"
          value={formData.property_type}
          onChange={handleChange}
          className="rounded-lg border p-3"
        >
          <option>House</option>
          <option>Apartment</option>
          <option>Villa</option>
          <option>Penthouse</option>
          <option>Land</option>
          <option>Office</option>
        </select>

        <select
          name="status"
          value={formData.status}
          onChange={handleChange}
          className="rounded-lg border p-3"
        >
          <option>For Sale</option>
          <option>For Rent</option>
          <option>Sold</option>
        </select>

      </div>

      <button
        className="w-full rounded-lg bg-green-600 p-4 text-lg font-bold text-white hover:bg-green-700"
      >
        {submitText}
      </button>
    </form>
  );
}
