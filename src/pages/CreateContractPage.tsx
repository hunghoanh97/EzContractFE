import Layout from "@/components/Layout";
import Toast from "@/components/Toast";
import { apiFetch, API_BASE_URL } from "@/services/api";
import { getAccessTokenAuto } from "@/services/authService";
import { useEffect, useMemo, useState } from "react";

type Company = { id: string; name: string };
type Template = { id: string; name: string; fileNames?: string[] };

export default function CreateContractPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [companyId, setCompanyId] = useState<string>("");
  const [templateId, setTemplateId] = useState<string>("");
  // wordFile removed
  const [excelTemplate, setExcelTemplate] = useState<string>("");
  const [excelUpload, setExcelUpload] = useState<File | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);
  const [saving, setSaving] = useState(false);
  const [createdContracts, setCreatedContracts] = useState<any[]>([]);
  const [downloadingZip, setDownloadingZip] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const c = await apiFetch("/api/companies");
        setCompanies(Array.isArray(c) ? c.map((x: any) => ({ id: x.id, name: x.name })) : []);
        const t = await apiFetch("/api/contract-templates");
        setTemplates(Array.isArray(t) ? t : []);
      } catch (e) {}
    };
    load();
  }, []);

  const currentTemplate = useMemo(() => templates.find(t => t.id === templateId), [templates, templateId]);
  // wordFiles logic removed or kept just for info? User asked to remove select. 
  // Maybe show "Found X word files" info?
  const wordFilesCount = useMemo(() => (currentTemplate?.fileNames || []).filter(fn => fn.toLowerCase().endsWith('.doc') || fn.toLowerCase().endsWith('.docx')).length, [currentTemplate]);
  const excelFiles = useMemo(() => (currentTemplate?.fileNames || []).filter(fn => fn.toLowerCase().endsWith('.xls') || fn.toLowerCase().endsWith('.xlsx')), [currentTemplate]);
  const displayName = (fn: string) => { const idx = fn.indexOf('_'); return idx >= 0 ? fn.substring(idx + 1) : fn; };

  useEffect(() => {
    setCreatedContracts([]);
    setExcelTemplate(excelFiles[0] || "");
    setExcelUpload(null);
  }, [templateId]);

  const canInit = companyId && templateId;

  const downloadTemplateExcel = async () => {
    if (!templateId || !excelTemplate) return;
    try {
      const token = await getAccessTokenAuto();
      const res = await fetch(`${API_BASE_URL}/api/contract-templates/${templateId}/files/${excelTemplate}`, { headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) } });
      if (!res.ok) throw new Error(`API error ${res.status}`);
      const blob = await res.blob();
      const cd = res.headers.get('content-disposition') || '';
      const m = /filename="?([^";]+)"?/i.exec(cd);
      const fname = m ? m[1] : displayName(excelTemplate);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fname;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e: any) {
      const code = (e && (e as any).code) || '';
      const msg = String(e?.message || e);
      if (!(code === 'NETWORK_ABORTED' || msg.includes('NETWORK_ABORTED') || msg.includes('ERR_ABORTED'))) {
        setToast({ msg: 'Tải mẫu thất bại', type: 'error' });
      }
    }
  };

  const initContract = async () => {
    if (!canInit) { setToast({ msg: "Vui lòng chọn đầy đủ thông tin", type: "error" }); return; }
    setSaving(true);
    setCreatedContracts([]);
    try {
      const fd = new FormData();
      fd.append("companyId", companyId);
      fd.append("templateId", templateId);
      // wordFileName removed
      if (excelUpload) fd.append("excel", excelUpload);
      const data = await apiFetch(`/api/contracts/init`, { method: "POST", body: fd });
      if (Array.isArray(data)) {
        setCreatedContracts(data);
        setToast({ msg: `Đã tạo ${data.length} hợp đồng thành công`, type: "success" });
      } else {
        // Fallback if API returns single object (shouldn't happen with new backend)
         setToast({ msg: "Phản hồi không đúng định dạng", type: "error" });
      }
    } catch (e: any) {
      const code = (e && (e as any).code) || "";
      const msg = String(e?.message || e);
      if (code === 'NETWORK_ABORTED' || msg.includes('NETWORK_ABORTED') || msg.includes('ERR_ABORTED')) {
        return;
      }
      setToast({ msg: "Khởi tạo hợp đồng thất bại", type: "error" });
    } finally { setSaving(false); }
  };

  const handleDownloadZip = async () => {
    if (createdContracts.length === 0) return;
    setDownloadingZip(true);
    try {
      const token = await getAccessTokenAuto();
      const ids = createdContracts.map(c => c.id);
      const res = await fetch(`${API_BASE_URL}/api/contracts/download-zip`, { 
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}) 
        },
        body: JSON.stringify(ids)
      });
      
      if (!res.ok) throw new Error(`API error ${res.status}`);
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `contracts_${new Date().getTime()}.zip`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (e) {
      setToast({ msg: "Download Zip thất bại", type: "error" });
    } finally {
      setDownloadingZip(false);
    }
  };

  const handleDownloadOne = async (contract: any, fileName?: string) => {
      try {
        const token = await getAccessTokenAuto();
        const urlParams = fileName ? `?file=${encodeURIComponent(fileName)}` : '';
        const res = await fetch(`${API_BASE_URL}/api/contracts/${contract.id}/download${urlParams}`, {
          headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) }
        });
        if (!res.ok) throw new Error(`API error ${res.status}`);
        const blob = await res.blob();
        const cd = res.headers.get('content-disposition') || '';
        const m = /filename="?([^";]+)"?/i.exec(cd);
        // If specific file, use that name. If zip, use zip name.
        let fname = m ? m[1] : (fileName || (contract.fileId || 'document.docx'));
        if (!fileName && !m && contract.fileId && contract.fileId.startsWith('[')) fname = `contract_${contract.number}.zip`;
        
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fname;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } catch (e) {
        setToast({ msg: "Download file thất bại", type: "error" });
      }
  };

  const parseFiles = (fileId: string) => {
    try {
        if (fileId && fileId.trim().startsWith('[')) {
            return JSON.parse(fileId) as string[];
        }
    } catch {}
    return [fileId];
  };

  return (
    <Layout>
      <div className="bg-white border rounded-md mb-6">
        <div className="p-4 border-b flex items-center justify-between">
          <h2 className="text-xl font-semibold">Tạo hợp đồng</h2>
        </div>
        <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="text-sm text-gray-700">Công ty</label>
            <select className="border rounded px-3 py-2 w-full" value={companyId} onChange={e => setCompanyId(e.target.value)}>
              <option value="">Chọn công ty...</option>
              {companies.map(c => (<option key={c.id} value={c.id}>{c.name}</option>))}
            </select>
          </div>
          <div>
            <label className="text-sm text-gray-700">Mẫu hợp đồng</label>
            <select className="border rounded px-3 py-2 w-full" value={templateId} onChange={e => setTemplateId(e.target.value)}>
              <option value="">Chọn mẫu hợp đồng...</option>
              {templates.map(t => (<option key={t.id} value={t.id}>{t.name}</option>))}
            </select>
            {templateId && <div className="text-xs text-gray-500 mt-1">Tìm thấy {wordFilesCount} file Word mẫu.</div>}
          </div>
          {/* Word select removed */}
          <div>
            <label className="text-sm text-gray-700">File mẫu tài liệu (Excel)</label>
            <div className="border rounded px-3 py-2 w-full text-sm flex items-center justify-between">
              <span>{excelTemplate ? displayName(excelTemplate) : "(không có)"}</span>
              <button className="px-2 py-1 border rounded" disabled={!excelTemplate} onClick={downloadTemplateExcel}>Download mẫu</button>
            </div>
          </div>
          <div>
            <label className="text-sm text-gray-700">Upload file Excel (tùy chọn)</label>
            <input type="file" className="border rounded px-3 py-2 w-full" accept=".xls,.xlsx" onChange={e => setExcelUpload(e.target.files?.[0] || null)} />
            <div className="text-xs text-gray-500 mt-1">Sẽ đọc từ dòng 2: cột B mã, cột D giá trị để thay thế trong Word</div>
          </div>
        </div>
        <div className="p-4 border-t flex items-center justify-end space-x-3">
          <button className="px-3 py-2 rounded-md border" onClick={() => { setCompanyId(""); setTemplateId(""); setExcelUpload(null); setCreatedContracts([]); }}>Hủy</button>
          <button disabled={!canInit || saving} className="px-3 py-2 rounded-md bg-blue-600 text-white" onClick={initContract}>{saving ? "Đang xử lý..." : "Tạo hợp đồng"}</button>
        </div>
      </div>

      {createdContracts.length > 0 && (
        <div className="bg-white border rounded-md">
           <div className="p-4 border-b flex items-center justify-between">
             <h3 className="text-lg font-medium">Danh sách hợp đồng đã tạo ({createdContracts.length})</h3>
             <div className="flex space-x-2">
               <button 
                 onClick={handleDownloadZip} 
                 disabled={downloadingZip}
                 className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 disabled:opacity-50"
               >
                 {downloadingZip ? "Đang nén..." : "Download All (Zip)"}
               </button>
             </div>
           </div>
           <div className="overflow-x-auto">
             <table className="w-full text-sm text-left">
               <thead className="bg-gray-50 text-gray-700 uppercase font-medium">
                 <tr>
                   <th className="px-4 py-3">Số hợp đồng</th>
                   <th className="px-4 py-3">File đính kèm</th>
                   <th className="px-4 py-3">Ngày tạo</th>
                   <th className="px-4 py-3">Hành động</th>
                 </tr>
               </thead>
               <tbody>
                 {createdContracts.map((c) => {
                   const files = parseFiles(c.fileId);
                   return (
                   <tr key={c.id} className="border-b hover:bg-gray-50">
                     <td className="px-4 py-3 font-medium align-top">{c.number}</td>
                     <td className="px-4 py-3 text-gray-600 align-top">
                        {files.map((f, i) => (
                            <div key={i} className="flex items-center space-x-2 mb-1">
                                <span className="text-xs truncate max-w-[200px]" title={f}>{displayName(f)}</span>
                                <button onClick={() => handleDownloadOne(c, f)} className="text-blue-600 text-xs hover:underline">[Tải]</button>
                            </div>
                        ))}
                     </td>
                     <td className="px-4 py-3 text-gray-500 align-top">{new Date(c.createdAt).toLocaleString()}</td>
                     <td className="px-4 py-3 align-top">
                       <button 
                         onClick={() => handleDownloadOne(c)}
                         className="text-blue-600 hover:underline"
                       >
                         {files.length > 1 ? "Download Zip" : "Download"}
                       </button>
                     </td>
                   </tr>
                   );
                 })}
               </tbody>
             </table>
           </div>
        </div>
      )}

      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </Layout>
  );
}

