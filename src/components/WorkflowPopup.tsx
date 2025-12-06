import { useEffect, useRef, useState } from "react";
import { apiFetch } from "@/services/api";

type Props = {
  open: boolean;
  onClose: () => void;
  contractId: string;
};

export default function WorkflowPopup({ open, onClose, contractId }: Props) {
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [error, setError] = useState<string>("");
  const [flowId, setFlowId] = useState<string>("");
  const [sessionId, setSessionId] = useState<string>("");
  const pollRef = useRef<number | null>(null);

  const addLog = (m: string) => setLogs((l) => [new Date().toLocaleTimeString() + " - " + m, ...l]);

  const startHeadful = async () => {
    try {
      const data = await apiFetch("/api/DkkdAuth/playwright/start", { method: "POST" });
      setFlowId(data.flowId || "");
      addLog("Khởi chạy đăng nhập headful: " + (data.flowId || "-"));
    } catch (e: any) {
      const msg = String(e?.message || e);
      setError(msg);
      addLog("Lỗi khởi chạy headful: " + msg);
    }
  };

  const pollStatusAndFinish = async () => {
    if (!flowId) return;
    try {
      const data = await apiFetch(`/api/DkkdAuth/playwright/status/${flowId}`);
      if (data && data.loggedIn && data.cookie) {
        addLog("Đã đăng nhập, tiến hành hoàn tất");
        const fin = await apiFetch("/api/DkkdAuth/playwright/finish", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ flowId })
        });
        if (fin && fin.sessionId) {
          setSessionId(fin.sessionId);
          addLog("Tạo session nội bộ: " + fin.sessionId);
          if (pollRef.current) {
            window.clearInterval(pollRef.current);
            pollRef.current = null;
          }
          await runWorkflow(fin.sessionId);
        }
      }
    } catch (e: any) {
      const msg = String(e?.message || e);
      addLog("Lỗi khi kiểm tra trạng thái: " + msg);
    }
  };

  const runWorkflow = async (sid: string) => {
    if (!contractId) {
      setError("Thiếu contractId");
      return;
    }
    setError("");
    setLoading(true);
    try {
      addLog("Khởi tạo workflow");
      const init = await apiFetch("/api/BusinessRegistrationWorkflow/initialize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: sid }),
      });
      addLog("Workflow ID: " + (init?.workflowId || "-"));
      const auto = await apiFetch("/api/BusinessRegistrationWorkflow/auto/initial", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: sid, contractId }),
      });
      if (auto && auto.success) {
        addLog("Hoàn tất tự động Bước 1–2");
      } else {
        setError(String(auto?.message || "Khởi tạo thất bại"));
        addLog("Thất bại: " + (auto?.message || ""));
      }
    } catch (e: any) {
      const msg = String(e?.message || e);
      setError(msg);
      addLog("Lỗi: " + msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!open) {
      setLoading(false);
      setLogs([]);
      setError("");
      setFlowId("");
      setSessionId("");
      if (pollRef.current) {
        window.clearInterval(pollRef.current);
        pollRef.current = null;
      }
      return;
    }
    startHeadful().then(() => {
      if (pollRef.current) window.clearInterval(pollRef.current);
      pollRef.current = window.setInterval(pollStatusAndFinish, 3000) as any;
    });
    return () => {
      if (pollRef.current) {
        window.clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white rounded-md shadow-lg border" style={{ width: 800, height: 600 }}>
        <div className="flex items-center justify-between p-3 border-b">
          <h3 className="font-semibold">Quản lý workflow DKKD</h3>
          <button onClick={onClose} className="px-2 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded">Đóng</button>
        </div>
        <div className="p-4 h-[calc(600px-48px-48px)] overflow-auto">
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-3">
                <div className="text-sm text-gray-600">Đang thiết lập đăng nhập headful và tự động khởi tạo workflow</div>
              </div>
              <div className="col-span-3">
                <button
                  onClick={() => pollStatusAndFinish()}
                  disabled={!flowId || !!sessionId || loading}
                  className="px-3 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
                >
                  Kiểm tra trạng thái
                </button>
              </div>
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <div className="border rounded">
              <div className="p-2 border-b"><span className="font-medium">Nhật ký</span></div>
              <div className="p-2 space-y-1 h-64 overflow-auto">
                {logs.length === 0 && <p className="text-sm text-gray-500">Chưa có sự kiện</p>}
                {logs.map((l, idx) => (
                  <p key={idx} className="text-sm text-gray-700">{l}</p>
                ))}
              </div>
            </div>
          </div>
        </div>
        <div className="p-3 border-t text-xs text-gray-500">
          {loading ? "Đang xử lý..." : "Sẵn sàng"}
        </div>
      </div>
    </div>
  );
}
