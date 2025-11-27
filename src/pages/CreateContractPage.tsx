import Layout from "@/components/Layout";
import Toast from "@/components/Toast";
import { apiFetch, API_BASE_URL } from "@/services/api";
import { useEffect, useMemo, useState } from "react";

type Company = { id: string; name: string };
type Template = { id: string; name: string; fileNames?: string[] };

export default function CreateContractPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [companyId, setCompanyId] = useState<string>("");
  const [templateId, setTemplateId] = useState<string>("");
  const [wordFile, setWordFile] = useState<string>("");
  const [excelTemplate, setExcelTemplate] = useState<string>("");
  const [excelUpload, setExcelUpload] = useState<File | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);
  const [saving, setSaving] = useState(false);

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
  const wordFiles = useMemo(() => (currentTemplate?.fileNames || []).filter(fn => fn.toLowerCase().endsWith('.doc') || fn.toLowerCase().endsWith('.docx')), [currentTemplate]);
  const excelFiles = useMemo(() => (currentTemplate?.fileNames || []).filter(fn => fn.toLowerCase().endsWith('.xls') || fn.toLowerCase().endsWith('.xlsx')), [currentTemplate]);
  const displayName = (fn: string) => { const idx = fn.indexOf('_'); return idx >= 0 ? fn.substring(idx + 1) : fn; };

  useEffect(() => {
    setWordFile("");
    setExcelTemplate(excelFiles[0] || "");
    setExcelUpload(null);
  }, [templateId]);

  const canInit = companyId && templateId && wordFile;

  const downloadTemplateExcel = () => {
    if (!templateId || !excelTemplate) return;
    window.open(`${API_BASE_URL}/api/contract-templates/${templateId}/files/${excelTemplate}`, '_blank');
  };

  const initContract = async () => {
    if (!canInit) { setToast({ msg: "Vui lòng chọn đầy đủ thông tin", type: "error" }); return; }
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append("companyId", companyId);
      fd.append("templateId", templateId);
      fd.append("wordFileName", wordFile);
      if (excelUpload) fd.append("excel", excelUpload);
      const token = localStorage.getItem("jwt");
      const res = await fetch(`${API_BASE_URL}/api/contracts/init`, { method: "POST", headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: fd });
      if (!res.ok) throw new Error(`API error ${res.status}`);
      const data = await res.json();
      setToast({ msg: "Khởi tạo hợp đồng thành công", type: "success" });
      if (data?.downloadUrl) window.open(data.downloadUrl, '_blank');
    } catch (e) {
      setToast({ msg: "Khởi tạo hợp đồng thất bại", type: "error" });
    } finally { setSaving(false); }
  };

  return (
    <Layout>
      <div className="bg-white border rounded-md">
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
          </div>
          <div>
            <label className="text-sm text-gray-700">Mẫu người tham gia ký (Word)</label>
            <select className="border rounded px-3 py-2 w-full" value={wordFile} onChange={e => setWordFile(e.target.value)}>
              <option value="">Chọn file Word...</option>
              {wordFiles.map(fn => (<option key={fn} value={fn}>{displayName(fn)}</option>))}
            </select>
          </div>
          <div>
            <label className="text-sm text-gray-700">File mẫu tài liệu (Excel)</label>
            <div className="border rounded px-3 py-2 w-full text-sm flex items-center justify-between">
              <span>{excelTemplate ? displayName(excelTemplate) : "(không có)"}</span>
              <button className="px-2 py-1 border rounded" disabled={!excelTemplate} onClick={downloadTemplateExcel}>Download mẫu</button>
            </div>
          </div>
          <div className="md:col-span-2">
            <label className="text-sm text-gray-700">Upload file Excel (tùy chọn)</label>
            <input type="file" className="border rounded px-3 py-2 w-full" accept=".xls,.xlsx" onChange={e => setExcelUpload(e.target.files?.[0] || null)} />
            <div className="text-xs text-gray-500 mt-1">Sẽ đọc từ dòng 2: cột B mã, cột D giá trị để thay thế trong Word</div>
          </div>
        </div>
        <div className="p-4 border-t flex items-center justify-end space-x-3">
          <button className="px-3 py-2 rounded-md border" onClick={() => { setCompanyId(""); setTemplateId(""); setWordFile(""); setExcelUpload(null); }}>Hủy</button>
          <button disabled={!canInit || saving} className="px-3 py-2 rounded-md bg-blue-600 text-white" onClick={initContract}>{saving ? "Đang khởi tạo..." : "Khởi tạo hợp đồng"}</button>
        </div>
      </div>

      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </Layout>
  );
}

