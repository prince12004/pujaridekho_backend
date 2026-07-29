// Coordinates for common Indian cities used as birthplace/location lookups.
// India uses a single timezone (IST, UTC+5:30) nationwide, so no per-city
// timezone data is needed here.
export const INDIA_CITIES: { name: string; lat: number; lon: number }[] = [
  { name: "New Delhi", lat: 28.6139, lon: 77.209 },
  { name: "Mumbai", lat: 19.076, lon: 72.8777 },
  { name: "Bengaluru", lat: 12.9716, lon: 77.5946 },
  { name: "Kolkata", lat: 22.5726, lon: 88.3639 },
  { name: "Chennai", lat: 13.0827, lon: 80.2707 },
  { name: "Hyderabad", lat: 17.385, lon: 78.4867 },
  { name: "Pune", lat: 18.5204, lon: 73.8567 },
  { name: "Ahmedabad", lat: 23.0225, lon: 72.5714 },
  { name: "Jaipur", lat: 26.9124, lon: 75.7873 },
  { name: "Lucknow", lat: 26.8467, lon: 80.9462 },
  { name: "Kanpur", lat: 26.4499, lon: 80.3319 },
  { name: "Nagpur", lat: 21.1458, lon: 79.0882 },
  { name: "Patna", lat: 25.5941, lon: 85.1376 },
  { name: "Indore", lat: 22.7196, lon: 75.8577 },
  { name: "Bhopal", lat: 23.2599, lon: 77.4126 },
  { name: "Noida", lat: 28.5355, lon: 77.391 },
  { name: "Gurgaon", lat: 28.4595, lon: 77.0266 },
  { name: "Chandigarh", lat: 30.7333, lon: 76.7794 },
  { name: "Varanasi", lat: 25.3176, lon: 82.9739 },
  { name: "Haridwar", lat: 29.9457, lon: 78.1642 },
  { name: "Ujjain", lat: 23.1793, lon: 75.7849 },
  { name: "Amritsar", lat: 31.634, lon: 74.8723 },
  { name: "Surat", lat: 21.1702, lon: 72.8311 },
  { name: "Kochi", lat: 9.9312, lon: 76.2673 },
  { name: "Bhubaneswar", lat: 20.2961, lon: 85.8245 },
  { name: "Ranchi", lat: 23.3441, lon: 85.3096 },
  { name: "Guwahati", lat: 26.1445, lon: 91.7362 },
  { name: "Dehradun", lat: 30.3165, lon: 78.0322 },
];

export function findIndiaCity(name: string) {
  const normalized = name.trim().toLowerCase();
  return INDIA_CITIES.find((city) => city.name.toLowerCase() === normalized);
}
