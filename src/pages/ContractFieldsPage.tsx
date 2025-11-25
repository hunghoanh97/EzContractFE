import Layout from "@/components/Layout";
import Toast from "@/components/Toast";
import { apiFetch, API_BASE_URL } from "@/services/api";
import { useEffect, useMemo, useState } from "react";

type ContractField = { id: string; typeId?: string; name: string; code: string; dataType: string; isRequired: boolean; order: number; metaJson?: string };

export default function ContractFieldsPage() {
  const [items, setItems] = useState<ContractField[]>([]);
  const [types, setTypes] = useState<Array<{ id: string; name: string }>>([]);
  const [loading, setLoading] = useState(false);
  const [qName, setQName] = useState("");
  const [qCode, setQCode] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [editId, setEditId] = useState<string>("");
  const [form, setForm] = useState<{ code: string; name: string; defaultValue: string; dataType: string; status: string }>({ code: "", name: "", defaultValue: "", dataType: "string", status: "ACTIVE" });
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);
  const pageSize = 20;

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const data = await apiFetch("/api/contract-fields");
        setItems(Array.isArray(data) ? data : []);
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

  const parseMeta = (meta?: string) => {
    try { return meta ? JSON.parse(meta) : {}; } catch { return {}; }
  };

  const openAdd = () => {
    setIsEdit(false);
    setEditId("");
    setForm({ code: "", name: "", defaultValue: "", dataType: "string", status: "ACTIVE" });
    setShowForm(true);
  };

  const openEdit = (it: ContractField) => {
    const meta = parseMeta(it.metaJson);
    setIsEdit(true);
    setEditId(it.id);
    setForm({ code: it.code, name: it.name, defaultValue: meta.defaultValue || "", dataType: it.dataType || "string", status: meta.status || "ACTIVE" });
    setShowForm(true);
  };

  const save = async () => {
    setSaving(true);
    try {
      const payload: any = {
        code: form.code,
        name: form.name,
        dataType: form.dataType,
        isRequired: false,
        order: 0,
        metaJson: JSON.stringify({ defaultValue: form.defaultValue, status: form.status })
      };
      if (isEdit && editId) {
        await apiFetch(`/api/contract-fields/${editId}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      } else {
        await apiFetch(`/api/contract-fields`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      }
      const data = await apiFetch("/api/contract-fields");
      setItems(Array.isArray(data) ? data : []);
      setShowForm(false);
      setToast({ msg: isEdit ? "Cập nhật trường thành công" : "Thêm trường thành công", type: "success" });
    } catch (e) {
      setToast({ msg: isEdit ? "Cập nhật trường thất bại" : "Thêm trường thất bại", type: "error" });
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!isEdit || !editId) return;
    setSaving(true);
    try {
      const token = localStorage.getItem("jwt");
      await fetch(`${API_BASE_URL}/api/contract-fields/${editId}`, { method: "DELETE", headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) } });
      const data = await apiFetch("/api/contract-fields");
      setItems(Array.isArray(data) ? data : []);
      setShowForm(false);
      setToast({ msg: "Xóa trường thành công", type: "success" });
    } catch (e) {
      setToast({ msg: "Xóa trường thất bại", type: "error" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Layout>
      <div className="bg-white border rounded-md">
        <div className="p-4 border-b flex items-center justify-between">
          <h2 className="text-xl font-semibold">Trường hợp đồng</h2>
          <div className="flex items-center space-x-3">
            <div className="text-sm text-gray-500">Hiển thị {filtered.length} / {items.length}</div>
            <button onClick={openAdd} className="px-3 py-2 bg-blue-600 text-white rounded-md">Thêm mới</button>
          </div>
        </div>
        <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-3 border-b">
          <input className="border rounded px-3 py-2" placeholder="Tìm theo mô tả" value={qName} onChange={e => setQName(e.target.value)} />
          <input className="border rounded px-3 py-2" placeholder="Tìm theo mã" value={qCode} onChange={e => setQCode(e.target.value)} />
          <div className="text-sm text-gray-600 flex items-center">{loading ? "Đang tải dữ liệu..." : ""}</div>
        </div>
        <div className="p-0">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="p-2 w-16 text-center">STT</th>
                <th className="p-2 text-left">Mã</th>
                <th className="p-2 text-left">Mô tả</th>
                <th className="p-2 text-left">Giá trị mặc định</th>
                <th className="p-2 text-left">Kiểu dữ liệu</th>
                <th className="p-2 text-left">Trạng thái</th>
                
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td className="p-3 text-center text-gray-500" colSpan={7}>Không có dữ liệu</td></tr>
              )}
              {filtered.map((it, idx) => {
                const meta = parseMeta(it.metaJson);
                return (
                  <tr key={it.id} className="border-t hover:bg-gray-50 cursor-pointer" onClick={() => openEdit(it)}>
                    <td className="p-2 text-center">{idx + 1}</td>
                    <td className="p-2 font-mono text-sm">{it.code}</td>
                    <td className="p-2">{it.name}</td>
                    <td className="p-2">{meta.defaultValue || "-"}</td>
                    <td className="p-2">{it.dataType}</td>
                    <td className="p-2">{(meta.status || "ACTIVE") === "ACTIVE" ? "Hoạt động" : "Tạm dừng"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="p-4 border-t text-sm text-gray-500">Tối đa {pageSize} bản ghi đầu tiên</div>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded-md shadow-lg w-full max-w-2xl">
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="text-lg font-semibold">{isEdit ? "Sửa" : "Thêm mới"}</h3>
              <button className="text-gray-600" onClick={() => setShowForm(false)}>✕</button>
            </div>
            <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-3">
              <input className="border rounded px-3 py-2 w-full" placeholder="Mã" value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} />
              <input className="border rounded px-3 py-2 w-full" placeholder="Mô tả" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
              <input className="border rounded px-3 py-2 w-full" placeholder="Giá trị mặc định" value={form.defaultValue} onChange={e => setForm({ ...form, defaultValue: e.target.value })} />
              <select className="border rounded px-3 py-2 w-full" value={form.dataType} onChange={e => setForm({ ...form, dataType: e.target.value })}>
                <option value="string">string</option>
                <option value="number">number</option>
                <option value="bool">bool</option>
                <option value="datetime">datetime</option>
              </select>
              <select className="border rounded px-3 py-2 w-full" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                <option value="ACTIVE">Hoạt động</option>
                <option value="INACTIVE">Tạm dừng</option>
              </select>
            </div>
            <div className="p-4 border-t flex items-center justify-end space-x-3">
              <button className="px-3 py-2 rounded-md border" onClick={() => setShowForm(false)}>Hủy</button>
              <button disabled={saving || !isEdit} className="px-3 py-2 rounded-md bg-red-600 text-white" onClick={() => setConfirmDelete(true)}>Xóa</button>
              <button disabled={saving} className="px-3 py-2 rounded-md bg-blue-600 text-white" onClick={save}>{saving ? "Đang lưu..." : "Lưu"}</button>
            </div>
          </div>
        </div>
      )}

      {confirmDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded-md shadow-lg w-full max-w-md">
            <div className="p-4 border-b"><h3 className="text-lg font-semibold">Xác nhận xóa</h3></div>
            <div className="p-4 text-gray-700">Bạn có chắc muốn xóa trường này?</div>
            <div className="p-4 border-t flex items-center justify-end space-x-3">
              <button className="px-3 py-2 rounded-md border" onClick={() => setConfirmDelete(false)}>Hủy</button>
              <button className="px-3 py-2 rounded-md bg-red-600 text-white" onClick={() => { setConfirmDelete(false); remove(); }}>Xóa</button>
            </div>
          </div>
        </div>
      )}

      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </Layout>
  );
}
