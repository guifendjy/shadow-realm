export default function uniqid(prefix = "", length = 10) {
  const random = Math.random().toString(36).substring(2); // Generate a random base-36 string
  const timestamp = Date.now().toString(36); // Add a timestamp for uniqueness
  const uniqueId = (random + timestamp).substring(0, length); // Ensure the desired length
  return prefix ? `${prefix}_${uniqueId}` : uniqueId; // Add prefix if provided
}
