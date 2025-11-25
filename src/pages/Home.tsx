import Layout from "@/components/Layout";
import { useNavigate } from "react-router-dom";

export default function Home() {
  const navigate = useNavigate();

  return (
    <Layout>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900">Chào mừng đến ezContract</h2>
        <p className="text-gray-600">Quản lý đăng ký kinh doanh qua mạng và hợp đồng của doanh nghiệp.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg border p-6">
          <h3 className="text-lg font-semibold mb-2">Tiến độ workflow</h3>
          <p className="text-gray-600 mb-4">Theo dõi và thao tác với quy trình DKKD.</p>
          <button onClick={() => navigate('/workflow')} className="px-4 py-2 bg-blue-600 text-white rounded-md">Mở workflow</button>
        </div>
        <div className="bg-white rounded-lg border p-6">
          <h3 className="text-lg font-semibold mb-2">Bảng điều khiển</h3>
          <p className="text-gray-600 mb-4">Tổng quan hoạt động và tác vụ nhanh.</p>
          <button onClick={() => navigate('/dashboard')} className="px-4 py-2 bg-gray-800 text-white rounded-md">Mở dashboard</button>
        </div>
        <div className="bg-white rounded-lg border p-6">
          <h3 className="text-lg font-semibold mb-2">Quản trị</h3>
          <p className="text-gray-600 mb-4">Công ty, vai trò, người dùng.</p>
          <button onClick={() => navigate('/admin/companies')} className="px-4 py-2 bg-indigo-600 text-white rounded-md">Quản trị</button>
        </div>
      </div>
    </Layout>
  );
}
