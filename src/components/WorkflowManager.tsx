import { useState, useEffect, useRef } from "react";
import { apiFetch } from "@/services/api";

interface WorkflowManagerProps {
    contractId?: string;
    onClose?: () => void;
    isPopup?: boolean;
}

export default function WorkflowManager({ contractId, onClose, isPopup }: WorkflowManagerProps) {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<"idle" | "logging_in" | "automating" | "completed" | "error">("idle");
  const [message, setMessage] = useState("");
  const [flowId, setFlowId] = useState("");
  const pollRef = useRef<number | null>(null);

  const startLogin = async () => {
    try {
      setLoading(true);
      setStatus("logging_in");
      setMessage("Đang khởi động trình duyệt đăng nhập...");
      
      const data = await apiFetch("/api/DkkdAuth/playwright/start", { method: "POST" });
      if (data && data.flowId) {
        setFlowId(data.flowId);
        setMessage("Vui lòng đăng nhập trên trình duyệt vừa mở...");
        // Start polling
        if (pollRef.current) window.clearInterval(pollRef.current);
        pollRef.current = window.setInterval(() => checkStatus(data.flowId), 2000) as any;
      } else {
        throw new Error("Không thể khởi động trình duyệt");
      }
    } catch (e: any) {
      setStatus("error");
      setMessage("Lỗi: " + (e.message || e));
      setLoading(false);
    }
  };

  const checkStatus = async (fid: string) => {
    try {
      const data = await apiFetch(`/api/DkkdAuth/playwright/status/${fid}`);
      if (data && data.loggedIn) {
        // Logged in!
        if (pollRef.current) {
            window.clearInterval(pollRef.current);
            pollRef.current = null;
        }
        startAutomation(fid);
      }
    } catch (e) {
      console.error("Poll error", e);
    }
  };

  const startAutomation = async (fid: string) => {
    if (!contractId) {
        setStatus("error");
        setMessage("Thiếu Contract ID để thực hiện tự động hóa");
        return;
    }

    try {
        setStatus("automating");
        setMessage("Đăng nhập thành công! Đang thực hiện quy trình tự động...");
        
        const res = await apiFetch("/api/DkkdAuth/playwright/automation", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ flowId: fid, contractId: contractId })
        });

        if (res.success) {
            setStatus("completed");
            setMessage("Quy trình tự động hoàn tất thành công!");
        } else {
            throw new Error(res.error || "Lỗi không xác định");
        }
    } catch (e: any) {
        setStatus("error");
        setMessage("Lỗi tự động hóa: " + (e.message || e));
    } finally {
        setLoading(false);
    }
  };

  // Cleanup
  useEffect(() => {
    return () => {
        if (pollRef.current) window.clearInterval(pollRef.current);
    };
  }, []);

  return (
    <div className="h-full flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md bg-white rounded-lg shadow-md p-8 text-center space-y-6">
        <h2 className="text-2xl font-bold text-gray-800">Workflow DKKD</h2>
        
        {status === "idle" && (
            <div className="space-y-4">
                <p className="text-gray-600">Nhấn nút bên dưới để mở trình duyệt đăng nhập DKKD.</p>
                <button 
                    onClick={startLogin}
                    disabled={loading}
                    className="w-full px-4 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                >
                    Login DKKD
                </button>
            </div>
        )}

        {status === "logging_in" && (
            <div className="space-y-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-blue-600 font-medium">{message}</p>
                <p className="text-sm text-gray-500">Hệ thống đang chờ bạn đăng nhập...</p>
            </div>
        )}

        {status === "automating" && (
            <div className="space-y-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
                <p className="text-green-600 font-medium">{message}</p>
                <p className="text-sm text-gray-500">Đang điền thông tin và xử lý hồ sơ...</p>
            </div>
        )}

        {status === "completed" && (
            <div className="space-y-4">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
                    <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                </div>
                <p className="text-green-700 font-bold text-lg">Hoàn thành!</p>
                <p className="text-gray-600">{message}</p>
                {onClose && (
                    <button 
                        onClick={onClose}
                        className="mt-4 px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
                    >
                        Đóng
                    </button>
                )}
            </div>
        )}

        {status === "error" && (
            <div className="space-y-4">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                    <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </div>
                <p className="text-red-600 font-medium">{message}</p>
                <button 
                    onClick={() => setStatus("idle")}
                    className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                    Thử lại
                </button>
            </div>
        )}
      </div>
    </div>
  );
}
