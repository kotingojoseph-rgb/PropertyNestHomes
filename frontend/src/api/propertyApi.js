const API_URL =
  import.meta.env.VITE_API_URL ||
  "https://propertynesthomes.onrender.com/api/properties";

export async function getProperties() {
  const response = await fetch(API_URL);

  if (!response.ok) {
    throw new Error("Failed to fetch properties");
  }

  const data = await response.json();

  // Backend returns an array
  if (Array.isArray(data)) {
    return data;
  }

  // Safety if backend returns { properties: [] }
  if (Array.isArray(data.properties)) {
    return data.properties;
  }

  return [];
}
