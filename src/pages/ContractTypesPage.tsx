import Layout from "@/components/Layout";
import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "@/services/api";

type ContractType = {
  id: string;
  name: string;
  code: string;
  description: string;
  companyId?: string;
  status?: string;
  createdAt?: string;
};

export default function ContractTypesPage() {
  const [items, setItems] = useState<ContractType[]>([]);
  const [loading, setLoading] = useState(false);
  const [qName, setQName] = useState("");
  const [qCode, setQCode] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [editId, setEditId] = useState<string>("");
  const [form, setForm] = useState<{ name: string; code: string; description: string; companyId?: string; status?: string }>({ name: "", code: "", description: "", companyId: "", status: "ACTIVE" });
  const [saving, setSaving] = useState(false);
  const [companies, setCompanies] = useState<Array<{ id: string; name: string }>>([]);
  const pageSize = 20;

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const data = await apiFetch("/api/contract-types");
        setItems(Array.isArray(data) ? data : []);
        const comps = await apiFetch("/api/companies");
        setCompanies(Array.isArray(comps) ? comps.map((c: any) => ({ id: c.id, name: c.name })) : []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const filtered = useMemo(() => {
    return items
      .filter(it => (qName ? it.name.toLowerCase().includes(qName.toLowerCase()) : true))
      .filter(it => (qCode ? it.code.toLowerCase().includes(qCode.toLowerCase()) : true))
      .slice(0, pageSize);
  }, [items, qName, qCode]);

  const openAdd = () => {
    setIsEdit(false);
    setEditId("");
    setForm({ name: "", code: "", description: "", companyId: "" });
    setShowForm(true);
  };

  const openEdit = (it: ContractType) => {
    setIsEdit(true);
    setEditId(it.id);
    setForm({ name: it.name, code: it.code, description: it.description || "", companyId: it.companyId || "", status: it.status || "ACTIVE" });
    setShowForm(true);
  };

  const save = async () => {
    setSaving(true);
    try {
      if (isEdit && editId) {
        await apiFetch(`/api/contract-types/${editId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: form.name, code: form.code, description: form.description, companyId: form.companyId, status: form.status })
        });
      } else {
        await apiFetch("/api/contract-types", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form)
        });
      }
      const data = await apiFetch("/api/contract-types");
      setItems(Array.isArray(data) ? data : []);
      setShowForm(false);
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Layout>
      <div className="bg-white border rounded-md">
        <div className="p-4 border-b flex items-center justify-between">
          <h2 className="text-xl font-semibold">Loại hợp đồng</h2>
          <div className="flex items-center space-x-3">
            <div className="text-sm text-gray-500">Hiển thị {filtered.length} / {items.length}</div>
            <button onClick={openAdd} className="px-3 py-2 bg-blue-600 text-white rounded-md">Thêm mới</button>
          </div>
        </div>
        <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-3 border-b">
          <input
            className="border rounded px-3 py-2"
            placeholder="Tìm theo tên"
            value={qName}
            onChange={e => setQName(e.target.value)}
          />
          <input
            className="border rounded px-3 py-2"
            placeholder="Tìm theo mã"
            value={qCode}
            onChange={e => setQCode(e.target.value)}
          />
          <div className="text-sm text-gray-600 flex items-center">{loading ? "Đang tải dữ liệu..." : ""}</div>
        </div>
        <div className="p-0">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="p-2 w-16 text-center">STT</th>
                <th className="p-2 text-left">Loại hợp đồng</th>
                <th className="p-2 text-left">Mã loại hợp đồng</th>
                <th className="p-2 text-left">Công ty</th>
                <th className="p-2 text-left">Trạng thái</th>
                <th className="p-2 text-left">Mô tả</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td className="p-3 text-center text-gray-500" colSpan={5}>Không có dữ liệu</td>
                </tr>
              )}
              {filtered.map((it, idx) => (
                <tr key={it.id} className="border-t hover:bg-gray-50 cursor-pointer" onClick={() => openEdit(it)}>
                  <td className="p-2 text-center">{idx + 1}</td>
                  <td className="p-2">{it.name}</td>
                  <td className="p-2 font-mono text-sm">{it.code}</td>
                  <td className="p-2 text-gray-700">{companies.find(c => c.id === (it.companyId || ""))?.name || "-"}</td>
                  <td className="p-2 text-gray-700">{it.status === "ACTIVE" ? "Hoạt động" : it.status === "INACTIVE" ? "Tạm dừng" : (it.status || "-")}</td>
                  <td className="p-2 text-gray-700">{it.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="p-4 border-t text-sm text-gray-500">Tối đa {pageSize} bản ghi đầu tiên</div>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded-md shadow-lg w-full max-w-lg">
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="text-lg font-semibold">{isEdit ? "Sửa" : "Thêm mới"}</h3>
              <button className="text-gray-600" onClick={() => setShowForm(false)}>✕</button>
            </div>
            <div className="p-4 space-y-3">
              <input className="border rounded px-3 py-2 w-full" placeholder="Tên" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
              
              <input className="border rounded px-3 py-2 w-full" placeholder="Mô tả" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
              <select className="border rounded px-3 py-2 w-full" value={form.companyId} onChange={e => setForm({ ...form, companyId: e.target.value })}>
                <option value="">Chọn công ty...</option>
                {companies.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              <select className="border rounded px-3 py-2 w-full" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                <option value="ACTIVE">Hoạt động</option>
                <option value="INACTIVE">Tạm dừng</option>
              </select>
            </div>
            <div className="p-4 border-t flex items-center justify-end space-x-3">
              <button className="px-3 py-2 rounded-md border" onClick={() => setShowForm(false)}>Hủy</button>
              <button disabled={saving} className="px-3 py-2 rounded-md bg-blue-600 text-white" onClick={save}>{saving ? "Đang lưu..." : "Lưu"}</button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
