export const API_URL = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");

export async function apiFetch(path: string, init?: RequestInit) {
  if (!API_URL) {
    throw new Error("NEXT_PUBLIC_API_URL is not configured");
  }

  const response = await fetch(
    `${API_URL}${path.startsWith("/") ? path : `/${path}`}`,
    init
  );

  if (!response.ok) {
    let message = "Request failed";

    try {
      const data = await response.json();
      message = data.message || message;
    } catch {
      message = response.statusText || message;
    }

    throw new Error(message);
  }

  return response;
}
