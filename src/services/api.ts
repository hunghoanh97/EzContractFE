export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api";
import { getAccessTokenAuto, refreshAccessTokenByStoredTokens } from "@/services/authService";

export async function apiFetch(path: string, options: RequestInit = {}) {
  const token = await getAccessTokenAuto();
  const headers = {
    ...(options.headers || {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  } as Record<string, string>;
  try {
    let res = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });
    if (res.status === 401) {
      const newToken = await refreshAccessTokenByStoredTokens();
      if (newToken) {
        const retryHeaders = {
          ...(options.headers || {}),
          Authorization: `Bearer ${newToken}`,
        } as Record<string, string>;
        res = await fetch(`${API_BASE_URL}${path}`, { ...options, headers: retryHeaders });
      }
    }
    if (!res.ok) throw new Error(`API error ${res.status}`);
    const ct = res.headers.get("content-type") || "";
    if (res.status === 204 || !ct.toLowerCase().includes("application/json")) return null as any;
    const data = await res.json();
    return data;
  } catch (e: any) {
    const msg = String(e?.message || e);
    if (msg.includes("ERR_ABORTED")) {
      const err = new Error("NETWORK_ABORTED");
      (err as any).code = "NETWORK_ABORTED";
      throw err;
    }
    throw e;
  }
}
