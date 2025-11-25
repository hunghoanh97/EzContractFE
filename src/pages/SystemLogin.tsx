import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Toast from "@/components/Toast";
import { loginSystem, logoutSystem } from "@/services/authService";

export default function SystemLogin() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  const onLogin = async () => {
    try {
      await loginSystem(username, password);
      setError("");
      setToast({ msg: "Đăng nhập thành công", type: "success" });
      setTimeout(() => navigate("/"), 800);
    } catch (e) {
      setError("Đăng nhập thất bại");
      setToast({ msg: "Đăng nhập thất bại", type: "error" });
    }
  };

  const onLogout = () => {
    logoutSystem();
    setToast({ msg: "Đã đăng xuất", type: "success" });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Đăng nhập EzContract</h1>
          <p className="text-sm text-gray-600">Vui lòng nhập thông tin tài khoản</p>
        </div>
        <div className="space-y-4">
          <input className="border rounded px-3 py-2 w-full" placeholder="Tên đăng nhập" value={username} onChange={e => setUsername(e.target.value)} />
          <input type="password" className="border rounded px-3 py-2 w-full" placeholder="Mật khẩu" value={password} onChange={e => setPassword(e.target.value)} />
          {error && <div className="border border-red-200 bg-red-50 text-red-700 p-3 rounded">{error}</div>}
          <button className="w-full px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700" onClick={onLogin}>Đăng nhập</button>
          <button className="w-full px-3 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200" onClick={onLogout}>Làm mới</button>
        </div>
      </div>
      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
