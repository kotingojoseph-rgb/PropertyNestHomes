const API_BASE =
  import.meta.env.VITE_API_URL ||
  "https://api.propertynesthomes.com";

const API_URL = `${API_BASE}/api/properties`;

console.log("Using API:", API_URL);

export async function getProperties() {
  const response = await fetch(API_URL);

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const data = await response.json();

  console.log("Properties:", data);

  return Array.isArray(data) ? data : [];
}
