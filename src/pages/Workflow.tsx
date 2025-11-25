import { useState } from "react";
import Layout from "@/components/Layout";
import { apiFetch } from "@/services/api";

type Step = {
  code: string;
  title: string;
  status: "pending" | "in_progress" | "completed";
};

const initialSteps: Step[] = [
  { code: "REORGANIZATION", title: "Hình thức đăng ký", status: "pending" },
  { code: "ADDRESS", title: "Địa chỉ trụ sở", status: "pending" },
  { code: "BUSINESS_LINE", title: "Ngành nghề kinh doanh", status: "pending" },
  { code: "ENTERPRISE_NAME", title: "Tên doanh nghiệp", status: "pending" },
  { code: "OWNER_INFO", title: "Chủ sở hữu", status: "pending" },
  { code: "CAPITAL", title: "Vốn điều lệ", status: "pending" },
  { code: "LEGAL_REP", title: "Người đại diện PL", status: "pending" },
  { code: "TAX_INFO", title: "Thông tin thuế", status: "pending" },
  { code: "BENEFICIAL_OWNER", title: "Chủ sở hữu hưởng lợi", status: "pending" },
  { code: "SOCIAL_INSURANCE", title: "BHXH", status: "pending" },
  { code: "PRINT_INVOICE", title: "Hóa đơn", status: "pending" },
  { code: "CONTACT_PERSON", title: "Người liên hệ", status: "pending" },
  { code: "SIGNERS", title: "Người ký/xác thực", status: "pending" },
];

export default function Workflow() {
  const [steps, setSteps] = useState<Step[]>(initialSteps);
  const [log, setLog] = useState<string[]>([]);
  const [workflowId, setWorkflowId] = useState<string>("");
  const [beUsername, setBeUsername] = useState<string>("");
  const [bePassword, setBePassword] = useState<string>("");
  const [dkkdCookie, setDkkdCookie] = useState<string>("");
  const [flowId, setFlowId] = useState<string>("");
  const [pwCookie, setPwCookie] = useState<string>("");
  const [sessionIdInternal, setSessionIdInternal] = useState<string>("");

  const addLog = (m: string) => setLog((l) => [new Date().toLocaleTimeString() + " - " + m, ...l]);

  const initWorkflow = async () => {
    try {
      const data = await apiFetch("/api/BusinessRegistrationWorkflow/initialize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: "mock-session-fe-001" }),
      });
      setWorkflowId(data.workflowId || "");
      addLog("Khởi tạo workflow: " + (data.workflowId || "unknown"));
    } catch (e) {
      addLog("Khởi tạo thất bại: " + (e as Error).message);
    }
  };

  const mockFillEnterpriseName = async () => {
    if (!workflowId) return addLog("Chưa khởi tạo workflow");
    try {
      const payload = {
        workflowId,
        sectionCode: "ENTERPRISE_NAME",
        fieldValues: {
          "ctl00$C$DROP_NAME_TYPE": "2",
          "ctl00$C$NAMEFld": "ABC VIET NAM",
          "ctl00$C$SHORT_NAMEFld": "ABC VN",
        },
        actionName: "ctl00$C$BtnSave",
      };
      const data = await apiFetch("/api/BusinessRegistrationWorkflow/section/fill", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (data.success) {
        setSteps((s) => s.map((st) => (st.code === "ENTERPRISE_NAME" ? { ...st, status: "completed" } : st)));
        addLog("Điền tên doanh nghiệp thành công");
      } else {
        addLog("Điền tên doanh nghiệp lỗi: " + (data.message || ""));
      }
    } catch (e) {
      addLog("Điền thất bại: " + (e as Error).message);
    }
  };

  const completeWorkflow = async () => {
    if (!workflowId) return addLog("Chưa khởi tạo workflow");
    try {
      const data = await apiFetch(`/api/BusinessRegistrationWorkflow/complete/${workflowId}`, {
        method: "POST",
      });
      if (data.success) addLog("Hoàn thành workflow");
      else addLog("Hoàn thành thất bại: " + (data.message || ""));
    } catch (e) {
      addLog("Hoàn thành thất bại: " + (e as Error).message);
    }
  };

  const syncLoginToBE = async () => {
    if (!workflowId) return addLog("Chưa khởi tạo workflow");
    try {
      const payload = {
        workflowId,
        sectionCode: "LOGIN_STEP",
        fieldValues: {
          "ctl00$C$W1$UserName": beUsername,
          "ctl00$C$W1$Password": bePassword,
        },
        actionName: "ctl00$C$W1$btnStep1_Login",
      };
      const data = await apiFetch("/api/BusinessRegistrationWorkflow/section/fill", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (data.success) {
        setSteps((s) => s.map((st) => (st.code === "LOGIN_STEP" ? { ...st, status: "completed" } : st)));
        addLog("Đồng bộ đăng nhập BE thành công");
      } else {
        addLog("Đồng bộ đăng nhập BE lỗi: " + (data.message || ""));
      }
    } catch (e) {
      addLog("Đồng bộ đăng nhập BE thất bại: " + (e as Error).message);
    }
  };

  const syncCookieToBE = async () => {
    if (!workflowId) return addLog("Chưa khởi tạo workflow");
    if (!dkkdCookie) return addLog("Chưa nhập cookie DKKD");
    try {
      const data = await apiFetch("/api/BusinessRegistrationWorkflow/cookie/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workflowId, cookie: dkkdCookie }),
      });
      if (data.success) addLog("Đồng bộ cookie DKKD thành công");
      else addLog("Đồng bộ cookie thất bại");
    } catch (e) {
      addLog("Đồng bộ cookie thất bại: " + (e as Error).message);
    }
  };

  const startPlaywright = async () => {
    try {
      const data = await apiFetch("/api/DkkdAuth/playwright/start", { method: "POST" });
      setFlowId(data.flowId || "");
      addLog("Bắt đầu login headful: " + (data.flowId || "-"));
    } catch (e) {
      addLog("Bắt đầu headful thất bại: " + (e as Error).message);
    }
  };

  const getPlaywrightStatus = async () => {
    if (!flowId) return addLog("Chưa có flowId");
    try {
      const data = await apiFetch(`/api/DkkdAuth/playwright/status/${flowId}`);
      if (data.loggedIn && data.cookie) {
        setPwCookie(data.cookie);
        addLog("Đã đăng nhập, cookie: " + data.cookie);
      } else {
        addLog("Chưa đăng nhập hoặc chưa có cookie");
      }
    } catch (e) {
      addLog("Lấy trạng thái thất bại: " + (e as Error).message);
    }
  };

  const finishPlaywright = async () => {
    if (!flowId) return addLog("Chưa có flowId");
    try {
      const data = await apiFetch("/api/DkkdAuth/playwright/finish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ flowId })
      });
      if (data.sessionId) {
        setSessionIdInternal(data.sessionId);
        setPwCookie(data.cookie || "");
        addLog("Hoàn tất headful, session nội bộ: " + data.sessionId);
      } else {
        addLog("Hoàn tất headful thất bại");
      }
    } catch (e) {
      addLog("Hoàn tất headful thất bại: " + (e as Error).message);
    }
  };

  const initWorkflowWithSession = async () => {
    if (!sessionIdInternal) return addLog("Chưa có session nội bộ");
    try {
      const data = await apiFetch("/api/BusinessRegistrationWorkflow/initialize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: sessionIdInternal }),
      });
      setWorkflowId(data.workflowId || "");
      addLog("Khởi tạo workflow theo session nội bộ: " + (data.workflowId || "unknown"));
    } catch (e) {
      addLog("Khởi tạo theo session nội bộ thất bại: " + (e as Error).message);
    }
  };

  return (
    <Layout>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-semibold">Tiến độ workflow DKKD</h2>
        <div className="space-x-2">
          <button onClick={initWorkflow} className="px-3 py-2 bg-blue-600 text-white rounded-md">Khởi tạo</button>
          <button onClick={mockFillEnterpriseName} className="px-3 py-2 bg-green-600 text-white rounded-md">Điền thử Tên DN</button>
          <button onClick={completeWorkflow} className="px-3 py-2 bg-gray-800 text-white rounded-md">Hoàn thành</button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white border rounded-md">
          <div className="p-4 border-b flex justify-between">
            <div>
              <p className="text-sm text-gray-500">Workflow ID</p>
              <p className="font-mono text-sm">{workflowId || "-"}</p>
            </div>
          </div>
          <div className="p-4 border-b grid grid-cols-1 md:grid-cols-3 gap-3">
            <button onClick={startPlaywright} className="px-3 py-2 bg-blue-700 text-white rounded-md">Bắt đầu login headful</button>
            <button onClick={getPlaywrightStatus} className="px-3 py-2 bg-blue-500 text-white rounded-md">Lấy trạng thái</button>
            <button onClick={finishPlaywright} className="px-3 py-2 bg-blue-900 text-white rounded-md">Hoàn tất lấy cookie</button>
          </div>
          <div className="p-4 border-b grid grid-cols-1 md:grid-cols-3 gap-3">
            <input value={flowId} onChange={(e) => setFlowId(e.target.value)} placeholder="flowId" className="border rounded px-3 py-2" />
            <input value={pwCookie} onChange={(e) => setPwCookie(e.target.value)} placeholder="Cookie từ headful" className="border rounded px-3 py-2" />
            <input value={sessionIdInternal} onChange={(e) => setSessionIdInternal(e.target.value)} placeholder="Session nội bộ" className="border rounded px-3 py-2" />
          </div>
          <div className="p-4 border-b grid grid-cols-1 md:grid-cols-3 gap-3">
            <button onClick={initWorkflowWithSession} className="px-3 py-2 bg-purple-700 text-white rounded-md">Khởi tạo theo session nội bộ</button>
          </div>
          <div className="p-4 border-b grid grid-cols-1 md:grid-cols-3 gap-3">
            <input
              value={beUsername}
              onChange={(e) => setBeUsername(e.target.value)}
              placeholder="Tên đăng nhập BE"
              className="border rounded px-3 py-2"
            />
            <input
              type="password"
              value={bePassword}
              onChange={(e) => setBePassword(e.target.value)}
              placeholder="Mật khẩu BE"
              className="border rounded px-3 py-2"
            />
            <button onClick={syncLoginToBE} className="px-3 py-2 bg-yellow-600 text-white rounded-md">Đồng bộ đăng nhập BE</button>
          </div>
          <div className="p-4 border-b grid grid-cols-1 md:grid-cols-3 gap-3">
            <input
              value={dkkdCookie}
              onChange={(e) => setDkkdCookie(e.target.value)}
              placeholder="Dán cookie DKKD (VIBRIP3_SSC=...)"
              className="border rounded px-3 py-2 col-span-2"
            />
            <button onClick={syncCookieToBE} className="px-3 py-2 bg-indigo-600 text-white rounded-md">Đồng bộ cookie DKKD</button>
          </div>
          <ul className="divide-y">
            {steps.map((s) => (
              <li key={s.code} className="p-4 flex items-center justify-between">
                <div>
                  <p className="font-medium">{s.title}</p>
                  <p className="text-xs text-gray-500">{s.code}</p>
                </div>
                <span
                  className={
                    "text-xs px-2 py-1 rounded-full " +
                    (s.status === "completed"
                      ? "bg-green-100 text-green-700"
                      : s.status === "in_progress"
                      ? "bg-yellow-100 text-yellow-800"
                      : "bg-gray-100 text-gray-700")
                  }
                >
                  {s.status === "completed" ? "Hoàn thành" : s.status === "in_progress" ? "Đang xử lý" : "Chưa làm"}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-white border rounded-md">
          <div className="p-4 border-b">
            <p className="font-semibold">Nhật ký</p>
          </div>
          <div className="p-4 space-y-2">
            {log.length === 0 && <p className="text-sm text-gray-500">Chưa có sự kiện</p>}
            {log.map((l, idx) => (
              <p key={idx} className="text-sm text-gray-700">{l}</p>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
}
