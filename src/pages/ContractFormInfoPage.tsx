import Layout from "@/components/Layout";
import Toast from "@/components/Toast";
import { apiFetch, API_BASE_URL } from "@/services/api";
import { useEffect, useMemo, useState } from "react";

type CFV = { id: string; name: string; status: string; jsonForm: string; companyId: string };
type CF = { id: string; code: string; name: string; status?: string; dataType?: string };

export default function ContractFormInfoPage() {
  const [items, setItems] = useState<CFV[]>([]);
  const [loading, setLoading] = useState(false);
  const [qName, setQName] = useState("");
  const [qStatus, setQStatus] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [editId, setEditId] = useState<string>("");
  const [form, setForm] = useState<{ name: string; status: string; companyId: string; jsonForm: string }>({ name: "", status: "ACTIVE", companyId: "", jsonForm: "[]" });
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);
  const pageSize = 20;
  const [page, setPage] = useState(1);

  const [designOpen, setDesignOpen] = useState(false);
  const [availableFields, setAvailableFields] = useState<CF[]>([]);
  const [fieldSearch, setFieldSearch] = useState("");
  const [selectedFields, setSelectedFields] = useState<CF[]>([]);
  const [companies, setCompanies] = useState<Array<{ id: string; name: string }>>([]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const data = await apiFetch("/api/contract-field-values");
        setItems(Array.isArray(data) ? data : []);
        const comps = await apiFetch("/api/companies");
        setCompanies(Array.isArray(comps) ? comps.map((c: any) => ({ id: c.id, name: c.name })) : []);
      } finally { setLoading(false); }
    };
    load();
  }, []);

  const filteredAll = useMemo(() => {
    return items
      .filter(it => (qName ? it.name.toLowerCase().includes(qName.toLowerCase()) : true))
      .filter(it => (qStatus ? (it.status || "").toLowerCase().includes(qStatus.toLowerCase()) : true));
  }, [items, qName, qStatus]);
  const totalRecords = filteredAll.length;
  const totalPages = Math.max(1, Math.ceil(totalRecords / pageSize));
  const pageClamped = Math.min(page, totalPages);
  const filtered = useMemo(() => {
    const start = (pageClamped - 1) * pageSize;
    return filteredAll.slice(start, start + pageSize);
  }, [filteredAll, pageClamped]);
  useEffect(() => { setPage(1); }, [qName, qStatus]);

  const openAdd = () => {
    setIsEdit(false);
    setEditId("");
    setForm({ name: "", status: "ACTIVE", companyId: "", jsonForm: "[]" });
    setSelectedFields([]);
    setShowForm(true);
  };

  const openEdit = (it: CFV) => {
    setIsEdit(true);
    setEditId(it.id);
    setForm({ name: it.name, status: it.status || "ACTIVE", companyId: it.companyId || "", jsonForm: it.jsonForm || "[]" });
    try { setSelectedFields(JSON.parse(it.jsonForm || "[]").map((x: any) => ({ code: x.Name, name: x.Description, dataType: x.FieldType })) as CF[]); } catch { setSelectedFields([]); }
    setShowForm(true);
  };

  const save = async () => {
    setSaving(true);
    try {
      const jsonForm = JSON.stringify(selectedFields.map(f => ({ Name: f.code, Encrypt: false, Required: "false", FieldType: (f.dataType || "String"), Description: f.name, DefaultValue: "" })));
      const payload = { name: form.name, status: form.status, companyId: form.companyId, jsonForm };
      if (isEdit && editId) {
        await apiFetch(`/api/contract-field-values/${editId}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      } else {
        await apiFetch(`/api/contract-field-values`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      }
      const data = await apiFetch("/api/contract-field-values");
      setItems(Array.isArray(data) ? data : []);
      setShowForm(false);
      setToast({ msg: isEdit ? "Cập nhật form thông tin thành công" : "Thêm form thông tin thành công", type: "success" });
    } catch (e) {
      setToast({ msg: isEdit ? "Cập nhật form thông tin thất bại" : "Thêm form thông tin thất bại", type: "error" });
    } finally { setSaving(false); }
  };

  const remove = async () => {
    if (!isEdit || !editId) return;
    setSaving(true);
    try {
      const token = localStorage.getItem("jwt");
      await fetch(`${API_BASE_URL}/api/contract-field-values/${editId}`, { method: "DELETE", headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) } });
      const data = await apiFetch("/api/contract-field-values");
      setItems(Array.isArray(data) ? data : []);
      setShowForm(false);
      setToast({ msg: "Xóa form thông tin thành công", type: "success" });
    } catch (e) {
      setToast({ msg: "Xóa form thông tin thất bại", type: "error" });
    } finally { setSaving(false); }
  };

  const openDesign = async () => {
    try {
      const data = await apiFetch("/api/contract-fields");
      const actives = (Array.isArray(data) ? data : []).filter((x: any) => (x.status || "").toUpperCase() === "ACTIVE");
      setAvailableFields(actives.map((x: any) => ({ id: x.id, code: x.code, name: x.name, dataType: x.dataType })));
      setDesignOpen(true);
    } catch (e) {
      setToast({ msg: "Tải trường thất bại", type: "error" });
    }
  };

  const filteredAvail = useMemo(() => availableFields.filter(f => (fieldSearch ? f.name.toLowerCase().includes(fieldSearch.toLowerCase()) || f.code.toLowerCase().includes(fieldSearch.toLowerCase()) : true)), [availableFields, fieldSearch]);

  const onDragStart = (e: React.DragEvent, f: CF) => { e.dataTransfer.setData("text/plain", JSON.stringify(f)); };
  const onDropSelect = (e: React.DragEvent) => {
    e.preventDefault();
    const txt = e.dataTransfer.getData("text/plain");
    if (!txt) return;
    try {
      const f = JSON.parse(txt) as CF;
      setSelectedFields(prev => prev.find(p => p.code === f.code) ? prev : [...prev, f]);
    } catch {}
  };
  const onDragOver = (e: React.DragEvent) => e.preventDefault();

  const removeSelected = (code: string) => setSelectedFields(prev => prev.filter(p => p.code !== code));

  return (
    <Layout>
      <div className="bg-white border rounded-md">
        <div className="p-4 border-b flex items-center justify-between">
          <h2 className="text-xl font-semibold">Form thông tin trong mẫu</h2>
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
                <th className="p-2 text-left">Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (<tr><td className="p-3 text-center text-gray-500" colSpan={3}>Không có dữ liệu</td></tr>)}
              {filtered.map((it, idx) => (
                <tr key={it.id} className="border-t hover:bg-gray-50 cursor-pointer" onClick={() => openEdit(it)}>
                  <td className="p-2 text-center">{idx + 1}</td>
                  <td className="p-2">{it.name}</td>
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
              <select className="border rounded px-3 py-2 w-full" value={form.companyId} onChange={e => setForm({ ...form, companyId: e.target.value })}>
                <option value="">Chọn công ty...</option>
                {companies.map(c => (<option key={c.id} value={c.id}>{c.name}</option>))}
              </select>
            </div>
            <div className="px-4 pb-2">
              <button className="px-3 py-2 rounded-md border" onClick={openDesign}>Thiết kế form</button>
            </div>
            <div className="p-4 border-t flex items-center justify-end space-x-3">
              <button className="px-3 py-2 rounded-md border" onClick={() => setShowForm(false)}>Đóng</button>
              <button disabled={saving || !isEdit} className="px-3 py-2 rounded-md bg-red-600 text-white" onClick={() => setConfirmDelete(true)}>Xóa</button>
              <button disabled={saving} className="px-3 py-2 rounded-md bg-blue-600 text-white" onClick={save}>{saving ? "Đang lưu..." : "Lưu"}</button>
            </div>
          </div>
        </div>
      )}

      {designOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded-md shadow-lg w-full max-w-4xl">
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="text-lg font-semibold">Thiết kế form - chọn trường</h3>
              <button className="text-gray-600" onClick={() => setDesignOpen(false)}>✕</button>
            </div>
            <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <input className="border rounded px-3 py-2 w-full mb-3" placeholder="Tìm trường..." value={fieldSearch} onChange={e => setFieldSearch(e.target.value)} />
                <div className="border rounded p-3 h-80 overflow-auto available-fields">
                  {filteredAvail.map(f => (
                    <div key={f.code} className="draggable-field flex items-center justify-between py-1" draggable onDragStart={e => onDragStart(e, f)}>
                      <span className="font-mono text-sm">{f.code}</span>
                      <span className="text-gray-700">{f.name}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600 mb-2">Kéo thả trường vào khu vực dưới để chọn</div>
                <div className="border rounded p-3 h-80 overflow-auto selected-fields" onDrop={onDropSelect} onDragOver={onDragOver}>
                  {selectedFields.map(f => (
                    <div key={f.code} className="selected-field flex items-center justify-between py-1">
                      <div>
                        <span className="font-mono text-sm mr-2">{f.code}</span>
                        <span className="text-gray-700">{f.name}</span>
                      </div>
                      <button className="text-red-600 text-sm" onClick={() => removeSelected(f.code)}>Xóa</button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="p-4 border-t flex items-center justify-end space-x-3">
              <button className="px-3 py-2 rounded-md border" onClick={() => setDesignOpen(false)}>Lưu</button>
            </div>
          </div>
        </div>
      )}

      {confirmDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded-md shadow-lg w-full max-w-md">
            <div className="p-4 border-b"><h3 className="text-lg font-semibold">Xác nhận xóa</h3></div>
            <div className="p-4 text-gray-700">Bạn có chắc muốn xóa form này?</div>
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
