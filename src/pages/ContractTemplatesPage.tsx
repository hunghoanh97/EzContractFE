import Layout from "@/components/Layout";
import Toast from "@/components/Toast";
import { apiFetch, API_BASE_URL } from "@/services/api";
import { useEffect, useMemo, useState } from "react";

type CT = { id: string; name: string; description: string; contractTypeId: string; contractFormDataId: string; status: string; fileNames?: string[] };
type ContractType = { id: string; name: string };
type CFV = { id: string; name: string };

export default function ContractTemplatesPage() {
  const [items, setItems] = useState<CT[]>([]);
  const [types, setTypes] = useState<ContractType[]>([]);
  const [forms, setForms] = useState<CFV[]>([]);
  const [loading, setLoading] = useState(false);
  const [qName, setQName] = useState("");
  const [qStatus, setQStatus] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [editId, setEditId] = useState<string>("");
  const [form, setForm] = useState<{ name: string; description: string; status: string; contractTypeId: string; contractFormDataId: string }>({ name: "", description: "", status: "ACTIVE", contractTypeId: "", contractFormDataId: "" });
  const [wordFile, setWordFile] = useState<File | null>(null);
  const [excelFile, setExcelFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);
  const pageSize = 20;
  const [page, setPage] = useState(1);
  const displayName = (fn: string) => {
    const idx = fn.indexOf('_');
    return idx >= 0 ? fn.substring(idx + 1) : fn;
  };

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const data = await apiFetch("/api/contract-templates");
        setItems(Array.isArray(data) ? data : []);
        const t = await apiFetch("/api/contract-types");
        setTypes(Array.isArray(t) ? t.map((x: any) => ({ id: x.id, name: x.name })) : []);
        const f = await apiFetch("/api/contract-field-values");
        setForms(Array.isArray(f) ? f.map((x: any) => ({ id: x.id, name: x.name })) : []);
      } finally { setLoading(false); }
    };
    load();
  }, []);

  const filteredAll = useMemo(() => items.filter(it => (qName ? it.name.toLowerCase().includes(qName.toLowerCase()) : true)).filter(it => (qStatus ? (it.status || "").toLowerCase().includes(qStatus.toLowerCase()) : true)), [items, qName, qStatus]);
  const totalRecords = filteredAll.length;
  const totalPages = Math.max(1, Math.ceil(totalRecords / pageSize));
  const pageClamped = Math.min(page, totalPages);
  const filtered = useMemo(() => { const start = (pageClamped - 1) * pageSize; return filteredAll.slice(start, start + pageSize); }, [filteredAll, pageClamped]);
  useEffect(() => { setPage(1); }, [qName, qStatus]);

  const openAdd = () => {
    setIsEdit(false); setEditId(""); setForm({ name: "", description: "", status: "ACTIVE", contractTypeId: "", contractFormDataId: "" }); setWordFile(null); setExcelFile(null); setShowForm(true);
  };
  const openEdit = (it: CT) => {
    setIsEdit(true); setEditId(it.id); setForm({ name: it.name, description: it.description || "", status: it.status || "ACTIVE", contractTypeId: it.contractTypeId || "", contractFormDataId: it.contractFormDataId || "" }); setWordFile(null); setExcelFile(null); setShowForm(true);
  };

  const save = async () => {
    setSaving(true);
    try {
      let created: any;
      if (isEdit && editId) {
        created = await apiFetch(`/api/contract-templates/${editId}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      } else {
        created = await apiFetch(`/api/contract-templates`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      }
      const id = created?.id || editId;
      if (id && (wordFile || excelFile)) {
        const token = localStorage.getItem("jwt");
        const fd = new FormData();
        if (wordFile) fd.append("files", wordFile);
        if (excelFile) fd.append("files", excelFile);
        const res = await fetch(`${API_BASE_URL}/api/contract-templates/${id}/files`, { method: "POST", headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: fd });
        try {
          if (res.ok) {
            const j = await res.json();
            if (j?.import?.addedFields) {
              setToast({ msg: `Đã import từ Excel: thêm ${j.import.addedFields} trường`, type: "success" });
            }
          }
        } catch {}
      }
      const data = await apiFetch("/api/contract-templates");
      setItems(Array.isArray(data) ? data : []);
      setShowForm(false);
      setToast({ msg: isEdit ? "Cập nhật mẫu hợp đồng thành công" : "Thêm mẫu hợp đồng thành công", type: "success" });
    } catch (e) {
      setToast({ msg: isEdit ? "Cập nhật mẫu hợp đồng thất bại" : "Thêm mẫu hợp đồng thất bại", type: "error" });
    } finally { setSaving(false); }
  };

  const remove = async () => {
    if (!isEdit || !editId) return;
    setSaving(true);
    try {
      const token = localStorage.getItem("jwt");
      await fetch(`${API_BASE_URL}/api/contract-templates/${editId}`, { method: "DELETE", headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) } });
      const data = await apiFetch("/api/contract-templates");
      setItems(Array.isArray(data) ? data : []);
      setShowForm(false);
      setToast({ msg: "Xóa mẫu hợp đồng thành công", type: "success" });
    } catch (e) {
      setToast({ msg: "Xóa mẫu hợp đồng thất bại", type: "error" });
    } finally { setSaving(false); }
  };

  return (
    <Layout>
      <div className="bg-white border rounded-md">
        <div className="p-4 border-b flex items-center justify-between">
          <h2 className="text-xl font-semibold">Mẫu hợp đồng</h2>
          <div className="flex items-center space-x-3">
            <div className="text-sm text-gray-500">Hiển thị {filtered.length} / {filteredAll.length}</div>
            <button onClick={openAdd} className="px-3 py-2 bg-blue-600 text-white rounded-md">Thêm mới</button>
          </div>
        </div>
        <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-3 border-b">
          <input className="border rounded px-3 py-2" placeholder="Tìm theo tên" value={qName} onChange={e => setQName(e.target.value)} />
          <input className="border rounded px-3 py-2" placeholder="Tìm theo trạng thái" value={qStatus} onChange={e => setQStatus(e.target.value)} />
          <div className="text-sm text-gray-600 flex items-center">{loading ? "Đang tải dữ liệu..." : ""}</div>
        </div>
        <div className="p-0">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="p-2 w-16 text-center">STT</th>
                <th className="p-2 text-left">Tên</th>
                <th className="p-2 text-left">Loại hợp đồng</th>
                <th className="p-2 text-left">Mô tả</th>
                <th className="p-2 text-left">Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (<tr><td className="p-3 text-center text-gray-500" colSpan={5}>Không có dữ liệu</td></tr>)}
              {filtered.map((it, idx) => (
                <tr key={it.id} className="border-t hover:bg-gray-50 cursor-pointer" onClick={() => openEdit(it)}>
                  <td className="p-2 text-center">{idx + 1}</td>
                  <td className="p-2">{it.name}</td>
                  <td className="p-2">{types.find(t => t.id === it.contractTypeId)?.name || "-"}</td>
                  <td className="p-2">{it.description}</td>
                  <td className="p-2">{(it.status || "ACTIVE") === "ACTIVE" ? "Hoạt động" : "Tạm dừng"}</td>
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
          <div className="bg-white rounded-md shadow-lg w-full max-w-2xl">
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="text-lg font-semibold">{isEdit ? "Sửa" : "Thêm mới"}</h3>
              <button className="text-gray-600" onClick={() => setShowForm(false)}>✕</button>
            </div>
            <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-3">
              <input className="border rounded px-3 py-2 w-full" placeholder="Tên" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
              <select className="border rounded px-3 py-2 w-full" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                <option value="ACTIVE">Hoạt động</option>
                <option value="INACTIVE">Tạm dừng</option>
              </select>
              <select className="border rounded px-3 py-2 w-full" value={form.contractTypeId} onChange={e => setForm({ ...form, contractTypeId: e.target.value })}>
                <option value="">Chọn loại hợp đồng...</option>
                {types.map(t => (<option key={t.id} value={t.id}>{t.name}</option>))}
              </select>
              <select className="border rounded px-3 py-2 w-full" value={form.contractFormDataId} onChange={e => setForm({ ...form, contractFormDataId: e.target.value })}>
                <option value="">Chọn form thông tin...</option>
                {forms.map(f => (<option key={f.id} value={f.id}>{f.name}</option>))}
              </select>
              <textarea className="border rounded px-3 py-2 w-full md:col-span-2" rows={3} placeholder="Mô tả" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
              <div className="md:col-span-1">
                <label className="text-sm text-gray-700">File Word</label>
                <input type="file" accept=".doc,.docx" className="border rounded px-3 py-2 w-full" onChange={e => setWordFile(e.target.files?.[0] || null)} />
                {isEdit && items.find(x => x.id === editId)?.fileNames?.filter(fn => fn.toLowerCase().endsWith('.doc') || fn.toLowerCase().endsWith('.docx')).map(fn => (
                  <div key={fn} className="flex items-center justify-between text-sm mt-2 border rounded px-2 py-1">
                    <span className="truncate mr-2">{displayName(fn)}</span>
                    <div className="flex items-center space-x-2">
                      <button className="text-gray-700" onClick={() => window.open(`${API_BASE_URL}/api/contract-templates/${editId}/files/${fn}`, '_blank')}>Tải file</button>
                      <button className="text-red-600" onClick={async () => { try { const token = localStorage.getItem('jwt'); await fetch(`${API_BASE_URL}/api/contract-templates/${editId}/files/${fn}`, { method: 'DELETE', headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) } }); const data = await apiFetch('/api/contract-templates'); setItems(Array.isArray(data) ? data : []); } catch (e: any) { const msg = String(e?.message || e); if (!msg.includes('ERR_ABORTED')) console.error(e); } }}>Xóa</button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="md:col-span-1">
                <label className="text-sm text-gray-700">File Excel</label>
                <input type="file" accept=".xls,.xlsx" className="border rounded px-3 py-2 w-full" onChange={e => setExcelFile(e.target.files?.[0] || null)} />
                {isEdit && items.find(x => x.id === editId)?.fileNames?.filter(fn => fn.toLowerCase().endsWith('.xls') || fn.toLowerCase().endsWith('.xlsx')).map(fn => (
                  <div key={fn} className="flex items-center justify-between text-sm mt-2 border rounded px-2 py-1">
                    <span className="truncate mr-2">{displayName(fn)}</span>
                    <div className="flex items-center space-x-2">
                      <button className="text-gray-700" onClick={() => window.open(`${API_BASE_URL}/api/contract-templates/${editId}/files/${fn}`, '_blank')}>Tải file</button>
                      <button className="text-red-600" onClick={async () => { try { const token = localStorage.getItem('jwt'); await fetch(`${API_BASE_URL}/api/contract-templates/${editId}/files/${fn}`, { method: 'DELETE', headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) } }); const data = await apiFetch('/api/contract-templates'); setItems(Array.isArray(data) ? data : []); } catch (e: any) { const msg = String(e?.message || e); if (!msg.includes('ERR_ABORTED')) console.error(e); } }}>Xóa</button>
                    </div>
                  </div>
                ))}
                
              </div>
            </div>
            <div className="p-4 border-t flex items-center justify-end space-x-3">
              <button className="px-3 py-2 rounded-md border" onClick={() => setShowForm(false)}>Đóng</button>
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
            <div className="p-4 text-gray-700">Bạn có chắc muốn xóa mẫu hợp đồng này?</div>
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
