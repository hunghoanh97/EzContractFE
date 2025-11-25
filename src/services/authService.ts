import { API_BASE_URL } from "@/services/api";

export async function loginSystem(username: string, password: string) {
  const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password })
  });
  if (!res.ok) throw new Error("Đăng nhập thất bại");
  const data = await res.json();
  localStorage.setItem("jwt", data.token);
  return data.token as string;
}

export function logoutSystem() {
  localStorage.removeItem("jwt");
}

export function authHeader() {
  const t = localStorage.getItem("jwt");
  return t ? { Authorization: `Bearer ${t}` } : {};
}
