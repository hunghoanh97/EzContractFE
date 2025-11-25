import Layout from "@/components/Layout";
import { API_BASE_URL, apiFetch } from "@/services/api";
import { useEffect, useState } from "react";

type Company = { id?: string; name: string; code: string; isActive: boolean };

export default function CompaniesPage() {
  const [items, setItems] = useState<Company[]>([]);
  const [form, setForm] = useState<Company>({ name: "", code: "", isActive: true });
  const load = async () => {
    const data = await apiFetch("/api/companies");
    setItems(data);
  };
  const create = async () => {
    await fetch(`${API_BASE_URL}/api/companies`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    setForm({ name: "", code: "", isActive: true });
    load();
  };
  useEffect(() => { load(); }, []);
  return (
    <Layout>
      <h2 className="text-xl font-semibold mb-4">Công ty</h2>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
        <input className="border rounded px-3 py-2" placeholder="Tên" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
        <input className="border rounded px-3 py-2" placeholder="Mã" value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} />
        <select className="border rounded px-3 py-2" value={form.isActive ? "1" : "0"} onChange={e => setForm({ ...form, isActive: e.target.value === "1" })}>
          <option value="1">Kích hoạt</option>
          <option value="0">Tạm dừng</option>
        </select>
        <button className="px-3 py-2 bg-blue-600 text-white rounded" onClick={create}>Thêm</button>
      </div>
      <table className="w-full border">
        <thead>
          <tr className="bg-gray-100">
            <th className="p-2 text-left">Tên</th>
            <th className="p-2 text-left">Mã</th>
            <th className="p-2 text-left">Trạng thái</th>
          </tr>
        </thead>
        <tbody>
          {items.map(it => (
            <tr key={it.id} className="border-t">
              <td className="p-2">{it.name}</td>
              <td className="p-2">{it.code}</td>
              <td className="p-2">{it.isActive ? "Kích hoạt" : "Tạm dừng"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Layout>
  );
}
