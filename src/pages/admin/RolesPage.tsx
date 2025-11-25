import Layout from "@/components/Layout";
import { API_BASE_URL } from "@/services/api";
import { useEffect, useState } from "react";

type Role = { id?: string; name: string; code: string; permissionsJson: string };

export default function RolesPage() {
  const [items, setItems] = useState<Role[]>([]);
  const [form, setForm] = useState<Role>({ name: "", code: "", permissionsJson: "{}" });
  const load = async () => { const r = await fetch(`${API_BASE_URL}/api/roles`); setItems(await r.json()); };
  const create = async () => { await fetch(`${API_BASE_URL}/api/roles`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) }); setForm({ name: "", code: "", permissionsJson: "{}" }); load(); };
  useEffect(() => { load(); }, []);
  return (
    <Layout>
      <h2 className="text-xl font-semibold mb-4">Vai trò</h2>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
        <input className="border rounded px-3 py-2" placeholder="Tên" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
        <input className="border rounded px-3 py-2" placeholder="Mã" value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} />
        <input className="border rounded px-3 py-2" placeholder="Permissions JSON" value={form.permissionsJson} onChange={e => setForm({ ...form, permissionsJson: e.target.value })} />
        <button className="px-3 py-2 bg-blue-600 text-white rounded" onClick={create}>Thêm</button>
      </div>
      <ul className="space-y-2">
        {items.map(it => (<li key={it.id} className="border p-3"><div className="font-medium">{it.name}</div><div className="text-sm text-gray-600">{it.code}</div></li>))}
      </ul>
    </Layout>
  );
}
