const API_URL =
  import.meta.env.VITE_API_URL ||
  "https://propertynesthomes.onrender.com/api/properties";

export async function getProperties() {
  const response = await fetch(API_URL);

  if (!response.ok) {
    throw new Error("Failed to fetch properties");
  }

  const data = await response.json();

  // Make sure frontend always receives an array
  if (Array.isArray(data)) {
    return data;
  }

  if (Array.isArray(data.properties)) {
    return data.properties;
  }

  return [];
}
