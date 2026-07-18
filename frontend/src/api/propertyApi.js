const API_URL =
  import.meta.env.VITE_API_URL ||
  "https://propertynesthomes.onrender.com/api/properties";

export async function getProperties() {
  const response = await fetch(API_URL);

  if (!response.ok) {
    throw new Error("Failed to fetch properties");
  }

  return response.json();
}
