import Sidebar from "@/components/Sidebar";
import { useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { logoutSystem, isAuthenticatedSync, getTokensSync } from "@/services/authService";

export default function Layout({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const tokenObj = getTokensSync();
  const token = tokenObj?.accessToken || "";

  useEffect(() => {
    if (!isAuthenticatedSync()) navigate("/login", { replace: true });
  }, [navigate]);

  const userInfo = useMemo(() => {
    try {
      if (!token) return { username: undefined, role: undefined } as { username?: string; role?: string };
      const payload = token.split(".")[1];
      const base = payload.replace(/-/g, "+").replace(/_/g, "/");
      const padded = base + "===".slice((base.length + 3) % 4);
      const json = JSON.parse(atob(padded));
      const role = json["role"] || json["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"];
      const username = json["unique_name"] || json["name"];
      return { username, role } as { username?: string; role?: string };
    } catch {
      return { username: undefined, role: undefined } as { username?: string; role?: string };
    }
  }, [token]);

  const onLogout = () => {
    logoutSystem();
    navigate("/login", { replace: true });
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar />
      <div className="flex-1">
        <header className="bg-white border-b">
          <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
            <h1 className="text-lg font-semibold">ezContract SaaS</h1>
            <div className="flex items-center space-x-3">
              <div className="text-sm text-gray-700">
                <span className="font-medium">{userInfo.username || "-"}</span>
                <span className="mx-2 text-gray-400">|</span>
                <span className="uppercase">{userInfo.role || "-"}</span>
              </div>
              <button
                onClick={onLogout}
                className="px-3 py-1.5 rounded-md border text-sm text-gray-700 hover:bg-gray-100"
              >
                Đăng xuất
              </button>
            </div>
          </div>
        </header>
        <main className="max-w-7xl mx-auto px-6 py-6">{children}</main>
      </div>
    </div>
  );
}
