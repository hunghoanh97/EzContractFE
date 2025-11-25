export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

export async function apiFetch(path: string, options: RequestInit = {}) {
  const token = localStorage.getItem("jwt");
  const headers = {
    ...(options.headers || {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  } as Record<string, string>;
  const res = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });
  if (!res.ok) throw new Error(`API error ${res.status}`);
  return res.json();
}
