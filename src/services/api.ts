export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";
import { getAccessTokenAuto } from "@/services/authService";

export async function apiFetch(path: string, options: RequestInit = {}) {
  const token = await getAccessTokenAuto();
  const headers = {
    ...(options.headers || {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  } as Record<string, string>;
  const res = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });
  if (!res.ok) throw new Error(`API error ${res.status}`);
  const ct = res.headers.get("content-type") || "";
  if (res.status === 204 || !ct.toLowerCase().includes("application/json")) return null as any;
  return res.json();
}
