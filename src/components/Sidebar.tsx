import { Link, useLocation } from "react-router-dom";

const items = [
  { path: "/", label: "Trang chủ" },
  { path: "/admin/companies", label: "Công ty" },
  { path: "/admin/users", label: "Người dùng" },
  { path: "/admin/roles", label: "Vai trò" },
  { path: "/contract-types", label: "Loại hợp đồng" },
  { path: "/contract-templates", label: "Mẫu hợp đồng" },
  { path: "/create-contract", label: "Tạo hợp đồng" },
  { path: "/workflow", label: "Tiến độ workflow" },
];

export default function Sidebar() {
  const { pathname } = useLocation();
  return (
    <aside className="w-64 bg-white border-r h-screen sticky top-0">
      <div className="p-4 border-b">
        <h2 className="text-xl font-bold">ezContract</h2>
        <p className="text-xs text-gray-500">Quản lý đăng ký DKKD</p>
      </div>
      <nav className="p-2 space-y-1">
        {items.map((item) => {
          const active = pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={
                "block px-3 py-2 rounded-md text-sm " +
                (active
                  ? "bg-blue-50 text-blue-700 border border-blue-200"
                  : "text-gray-700 hover:bg-gray-50")
              }
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
