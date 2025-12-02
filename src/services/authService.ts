import { API_BASE_URL } from "@/services/api";

export async function loginSystem(username: string, password: string) {
  const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password })
  });
  if (!res.ok) throw new Error("Đăng nhập thất bại");
  const data = await res.json();
  const expiresAt = Date.now() + (Number(data.accessTokenExpiresIn || 300) * 1000);
  const tokens = { accessToken: data.accessToken, refreshToken: data.refreshToken, userId: data.userId, expiresAt };
  localStorage.setItem("auth.tokens", JSON.stringify(tokens));
  return data.accessToken as string;
}

export function logoutSystem() {
  localStorage.removeItem("auth.tokens");
}

function loadTokens(): { accessToken: string; refreshToken: string; userId: string; expiresAt: number } | null {
  try { const raw = localStorage.getItem("auth.tokens"); return raw ? JSON.parse(raw) : null; } catch { return null; }
}

function saveTokens(t: { accessToken: string; refreshToken: string; userId: string; expiresAt: number }) {
  localStorage.setItem("auth.tokens", JSON.stringify(t));
}

export async function getAccessTokenAuto(): Promise<string | null> {
  const t = loadTokens();
  if (!t) return null;
  const skewMs = 30000; // 30s skew
  const now = Date.now();
  if (t.expiresAt > now + skewMs) return t.accessToken;
  // refresh
  try {
    const res = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: t.userId, refreshToken: t.refreshToken })
    });
    if (!res.ok) { logoutSystem(); return null; }
    const data = await res.json();
    const expiresAt = Date.now() + (Number(data.accessTokenExpiresIn || 300) * 1000);
    const nt = { accessToken: data.accessToken, refreshToken: t.refreshToken, userId: t.userId, expiresAt };
    saveTokens(nt);
    return nt.accessToken;
  } catch {
    logoutSystem();
    return null;
  }
}

export function isAuthenticatedSync(): boolean {
  const t = loadTokens();
  if (!t) return false;
  return t.expiresAt > Date.now();
}
