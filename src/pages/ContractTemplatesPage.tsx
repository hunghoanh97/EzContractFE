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
  // Multi-file upload support
  type FileItem = {
    id: string;
    file: File;
    name: string;
    size: number;
    status: 'queued' | 'uploading' | 'uploaded' | 'error' | 'canceled';
    progress: number; // 0..100
    xhr?: XMLHttpRequest | null;
    serverFileName?: string | null;
    errorMsg?: string | null;
  };
  const [fileItems, setFileItems] = useState<FileItem[]>([]);
  const maxFileSize = 10 * 1024 * 1024; // 10MB
  const maxParallelUploads = 3;
  const [activeUploads, setActiveUploads] = useState(0);

  // helpers for queue management
  const removeQueued = (id: string) => setFileItems(prev => prev.filter(p => p.id !== id));

  const cancelUpload = (id: string) => {
    setFileItems(prev => prev.map(p => {
      if (p.id === id) {
        try { p.xhr?.abort(); } catch {}
        return { ...p, status: 'canceled', progress: 0 };
      }
      return p;
    }));
  };

  const cancelAll = () => {
    setFileItems(prev => { prev.forEach(p => { try { p.xhr?.abort(); } catch {} }); return []; });
  };

  const startAll = (templateId: string) => {
    for (const it of fileItems.filter(f => f.status === 'queued')) startUpload(templateId, it.id);
  };

  const startUpload = (templateId: string, fileItemId: string) => {
    setFileItems(prev => prev.map(p => p.id === fileItemId ? { ...p, status: 'uploading' } : p));
    const fi = fileItems.find(f => f.id === fileItemId);
    if (!fi) return;
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${API_BASE_URL}/api/contract-templates/${templateId}/files`);
    xhr.upload.onprogress = (ev) => {
      if (ev.lengthComputable) {
        const percent = Math.round((ev.loaded / ev.total) * 100);
        setFileItems(prev => prev.map(p => p.id === fileItemId ? { ...p, progress: percent } : p));
      }
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        setFileItems(prev => prev.map(p => p.id === fileItemId ? { ...p, status: 'uploaded', progress: 100, serverFileName: JSON.parse(xhr.responseText)?.template?.fileNames?.[0] || null } : p));
      } else {
        setFileItems(prev => prev.map(p => p.id === fileItemId ? { ...p, status: 'error', errorMsg: `Server error ${xhr.status}` } : p));
      }
    };
    xhr.onerror = () => {
      setFileItems(prev => prev.map(p => p.id === fileItemId ? { ...p, status: 'error', errorMsg: 'Network error' } : p));
    };
    xhr.onabort = () => {
      setFileItems(prev => prev.map(p => p.id === fileItemId ? { ...p, status: 'canceled', errorMsg: 'Canceled' } : p));
    };
    const fd = new FormData();
    fd.append('files', fi.file);
    // attach token if available (handled by apiFetch normally)
    xhr.send(fd);
    // store xhr ref
    setFileItems(prev => prev.map(p => p.id === fileItemId ? { ...p, xhr } : p));
  };
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
      // If there are queued client files for a new template, upload them now
      if (id) {
        // also handle legacy single files
        const fdLegacy = new FormData();
        if (wordFile) fdLegacy.append("files", wordFile);
        if (excelFile) fdLegacy.append("files", excelFile);
        if (fdLegacy.has("files")) {
          try {
            await apiFetch(`/api/contract-templates/${id}/files`, { method: "POST", body: fdLegacy });
          } catch (e) {
            console.error('Legacy upload failed', e);
          }
        }

        // start uploads for queued files (files selected before template creation)
        const queued = fileItems.filter(f => f.status === 'queued');
        if (queued.length > 0) {
          // kick off uploads (they will observe concurrency limit)
          for (const fi of queued) startUpload(id, fi.id);
        }
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
      await apiFetch(`/api/contract-templates/${editId}`, { method: "DELETE" });
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
                <input
                  type="file"
                  multiple
                  accept=".doc,.docx,.pdf,.jpg,.jpeg,.png"
                  className="border rounded px-3 py-2 w-full"
                  onChange={e => {
                    const files = Array.from(e.target.files || []);
                    const newItems: FileItem[] = files.map((f) => ({
                      id: `${Date.now()}_${f.name}_${Math.random().toString(36).slice(2)}`,
                      file: f,
                      name: f.name,
                      size: f.size,
                      status: f.size > maxFileSize ? 'error' : 'queued',
                      progress: 0,
                      xhr: null,
                      serverFileName: null,
                      errorMsg: f.size > maxFileSize ? 'File vượt quá 10MB' : null,
                    }));
                    setFileItems(prev => [...newItems, ...prev]);
                  }}
                />
                {isEdit && items.find(x => x.id === editId)?.fileNames?.filter(fn => fn.toLowerCase().endsWith('.doc') || fn.toLowerCase().endsWith('.docx')).map(fn => (
                  <div key={fn} className="flex items-center justify-between text-sm mt-2 border rounded px-2 py-1">
                    <span className="truncate mr-2">{displayName(fn)}</span>
                    <div className="flex items-center space-x-2">
                      <button className="text-gray-700" onClick={() => window.open(`${API_BASE_URL}/api/contract-templates/${editId}/files/${fn}`, '_blank')}>Tải file</button>
                      <button className="text-red-600" onClick={async () => { try { await apiFetch(`/api/contract-templates/${editId}/files/${fn}`, { method: 'DELETE' }); const data = await apiFetch('/api/contract-templates'); setItems(Array.isArray(data) ? data : []); } catch (e: any) { const code = (e && (e as any).code) || ""; const msg = String(e?.message || e); if (!(code === 'NETWORK_ABORTED' || msg.includes('NETWORK_ABORTED') || msg.includes('ERR_ABORTED'))) console.error(e); } }}>Xóa</button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="md:col-span-1">
                <label className="text-sm text-gray-700">File Excel</label>
                <input
                  type="file"
                  multiple
                  accept=".xls,.xlsx"
                  className="border rounded px-3 py-2 w-full"
                  onChange={e => {
                    const files = Array.from(e.target.files || []);
                    const newItems: FileItem[] = files.map((f) => ({
                      id: `${Date.now()}_${f.name}_${Math.random().toString(36).slice(2)}`,
                      file: f,
                      name: f.name,
                      size: f.size,
                      status: f.size > maxFileSize ? 'error' : 'queued',
                      progress: 0,
                      xhr: null,
                      serverFileName: null,
                      errorMsg: f.size > maxFileSize ? 'File vượt quá 10MB' : null,
                    }));
                    setFileItems(prev => [...newItems, ...prev]);
                  }}
                />
                {isEdit && items.find(x => x.id === editId)?.fileNames?.filter(fn => fn.toLowerCase().endsWith('.xls') || fn.toLowerCase().endsWith('.xlsx')).map(fn => (
                  <div key={fn} className="flex items-center justify-between text-sm mt-2 border rounded px-2 py-1">
                    <span className="truncate mr-2">{displayName(fn)}</span>
                    <div className="flex items-center space-x-2">
                      <button className="text-gray-700" onClick={() => window.open(`${API_BASE_URL}/api/contract-templates/${editId}/files/${fn}`, '_blank')}>Tải file</button>
                      <button className="text-red-600" onClick={async () => { try { await apiFetch(`/api/contract-templates/${editId}/files/${fn}`, { method: 'DELETE' }); const data = await apiFetch('/api/contract-templates'); setItems(Array.isArray(data) ? data : []); } catch (e: any) { const code = (e && (e as any).code) || ""; const msg = String(e?.message || e); if (!(code === 'NETWORK_ABORTED' || msg.includes('NETWORK_ABORTED') || msg.includes('ERR_ABORTED'))) console.error(e); } }}>Xóa</button>
                    </div>
                  </div>
                ))}
                {/* Upload queue UI */}
                <div className="md:col-span-2 mt-2 space-y-2">
                  {fileItems.map(it => (
                    <div key={it.id} className="flex items-center justify-between border rounded px-3 py-2 text-sm">
                      <div className="flex-1 mr-3">
                        <div className="font-medium truncate">{it.name}</div>
                        <div className="text-gray-500">{(it.size/1024/1024).toFixed(2)} MB • {it.status}</div>
                        <div className="h-2 bg-gray-200 rounded mt-1">
                          <div className={`h-2 rounded ${it.status==='error'?'bg-red-500':'bg-blue-600'}`} style={{ width: `${it.progress || (it.status==='uploaded'?100:0)}%` }} />
                        </div>
                        {it.errorMsg && <div className="text-red-600 mt-1">{it.errorMsg}</div>}
                      </div>
                      <div className="flex items-center space-x-2">
                        {it.status==='queued' && (
                          <button className="px-2 py-1 border rounded" onClick={() => { if (isEdit && editId) startUpload(editId, it.id); }}>
                            Tải lên
                          </button>
                        )}
                        {(it.status==='uploading') && (
                          <button className="px-2 py-1 border rounded" onClick={() => cancelUpload(it.id)}>Hủy</button>
                        )}
                        {(it.status==='queued' || it.status==='uploaded' || it.status==='error') && (
                          <button className="px-2 py-1 border rounded" onClick={() => removeQueued(it.id)}>Xóa</button>
                        )}
                      </div>
                    </div>
                  ))}
                  {isEdit && editId && fileItems.some(f=>f.status==='queued') && (
                    <div className="flex items-center space-x-2">
                      <button className="px-3 py-2 rounded-md bg-blue-600 text-white" onClick={() => startAll(editId)}>Tải tất cả</button>
                      <button className="px-3 py-2 rounded-md border" onClick={cancelAll}>Hủy tất cả</button>
                    </div>
                  )}
                </div>
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
