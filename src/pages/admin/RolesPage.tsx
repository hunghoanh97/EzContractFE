import Layout from "@/components/Layout";
import Toast from "@/components/Toast";
import { apiFetch, API_BASE_URL } from "@/services/api";
import { useEffect, useMemo, useState } from "react";

type Role = { id: string; name: string; code: string; permissionsJson?: string };

export default function RolesPage() {
  const [items, setItems] = useState<Role[]>([]);
  const [loading, setLoading] = useState(false);
  const [qName, setQName] = useState("");
  const [qCode, setQCode] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [editId, setEditId] = useState<string>("");
  const [form, setForm] = useState<{ name: string; code: string; permissionsJson: string }>({ name: "", code: "", permissionsJson: "" });
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);
  const pageSize = 20;
  const [page, setPage] = useState(1);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const data = await apiFetch("/api/roles");
        setItems(Array.isArray(data) ? data : []);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const filteredAll = useMemo(() => {
    return items
      .filter(it => (qName ? it.name.toLowerCase().includes(qName.toLowerCase()) : true))
      .filter(it => (qCode ? it.code.toLowerCase().includes(qCode.toLowerCase()) : true));
  }, [items, qName, qCode]);
  const totalRecords = filteredAll.length;
  const totalPages = Math.max(1, Math.ceil(totalRecords / pageSize));
  const pageClamped = Math.min(page, totalPages);
  const filtered = useMemo(() => {
    const start = (pageClamped - 1) * pageSize;
    return filteredAll.slice(start, start + pageSize);
  }, [filteredAll, pageClamped]);
  useEffect(() => { setPage(1); }, [qName, qCode]);

  const openAdd = () => {
    setIsEdit(false);
    setEditId("");
    setForm({ name: "", code: "", permissionsJson: "" });
    setShowForm(true);
  };

  const openEdit = (it: Role) => {
    setIsEdit(true);
    setEditId(it.id);
    setForm({ name: it.name, code: it.code, permissionsJson: it.permissionsJson || "" });
    setShowForm(true);
  };

  const save = async () => {
    setSaving(true);
    try {
      if (isEdit && editId) {
        await apiFetch(`/api/roles/${editId}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      } else {
        await apiFetch(`/api/roles`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      }
      const data = await apiFetch("/api/roles");
      setItems(Array.isArray(data) ? data : []);
      setShowForm(false);
      setToast({ msg: isEdit ? "Cập nhật vai trò thành công" : "Thêm vai trò thành công", type: "success" });
    } catch (e) {
      setToast({ msg: isEdit ? "Cập nhật vai trò thất bại" : "Thêm vai trò thất bại", type: "error" });
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!isEdit || !editId) return;
    setSaving(true);
    try {
      await apiFetch(`/api/roles/${editId}`, { method: "DELETE" });
      const data = await apiFetch("/api/roles");
      setItems(Array.isArray(data) ? data : []);
      setShowForm(false);
      setToast({ msg: "Xóa vai trò thành công", type: "success" });
    } catch (e) {
      setToast({ msg: "Xóa vai trò thất bại", type: "error" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Layout>
      <div className="bg-white border rounded-md">
        <div className="p-4 border-b flex items-center justify-between">
          <h2 className="text-xl font-semibold">Vai trò</h2>
          <div className="flex items-center space-x-3">
            <div className="text-sm text-gray-500">Hiển thị {filtered.length} / {filteredAll.length}</div>
            <button onClick={openAdd} className="px-3 py-2 bg-blue-600 text-white rounded-md">Thêm mới</button>
          </div>
        </div>
        <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-3 border-b">
          <input className="border rounded px-3 py-2" placeholder="Tìm theo tên" value={qName} onChange={e => setQName(e.target.value)} />
          <input className="border rounded px-3 py-2" placeholder="Tìm theo mã" value={qCode} onChange={e => setQCode(e.target.value)} />
          <div className="text-sm text-gray-600 flex items-center">{loading ? "Đang tải dữ liệu..." : ""}</div>
        </div>
        <div className="p-0">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="p-2 w-16 text-center">STT</th>
                <th className="p-2 text-left">Tên</th>
                <th className="p-2 text-left">Mã</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td className="p-3 text-center text-gray-500" colSpan={3}>Không có dữ liệu</td></tr>
              )}
              {filtered.map((it, idx) => (
                <tr key={it.id} className="border-t hover:bg-gray-50 cursor-pointer" onClick={() => openEdit(it)}>
                  <td className="p-2 text-center">{idx + 1}</td>
                  <td className="p-2">{it.name}</td>
                  <td className="p-2 font-mono text-sm">{it.code}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="p-4 border-t text-sm text-gray-700 flex items-center justify-between">
          <div>
            Trang
            <select className="border rounded px-2 py-1 mx-2" value={pageClamped} onChange={e => setPage(parseInt(e.target.value) || 1)}>
              {Array.from({ length: totalPages }).map((_, i) => (<option key={i+1} value={i+1}>{i+1}</option>))}
            </select>
            / {totalPages}
          </div>
          <div className="flex items-center space-x-2">
            <button className="px-2 py-1 border rounded" disabled={pageClamped <= 1} onClick={() => setPage(p => Math.max(1, p - 1))}>« Trước</button>
            <button className="px-2 py-1 border rounded" disabled={pageClamped >= totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))}>Sau »</button>
            <span className="ml-3">Tổng: {totalRecords}</span>
          </div>
        </div>
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
              <input className="border rounded px-3 py-2 w-full" placeholder="Mã" value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} />
              <textarea className="border rounded px-3 py-2 w-full" rows={4} placeholder="Permissions JSON (tùy chọn)" value={form.permissionsJson} onChange={e => setForm({ ...form, permissionsJson: e.target.value })} />
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
            <div className="p-4 text-gray-700">Bạn có chắc muốn xóa vai trò này?</div>
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
