import Layout from "@/components/Layout";
import Toast from "@/components/Toast";
import { apiFetch, API_BASE_URL } from "@/services/api";
import { useEffect, useMemo, useState } from "react";

type User = { id: string; username: string; fullName: string; email: string; roleId: string; companyId: string; isActive: boolean };

export default function UsersPage() {
  const [items, setItems] = useState<User[]>([]);
  const [roles, setRoles] = useState<Array<{ id: string; name: string; code: string }>>([]);
  const [companies, setCompanies] = useState<Array<{ id: string; name: string }>>([]);
  const [loading, setLoading] = useState(false);
  const [qUser, setQUser] = useState("");
  const [qCompany, setQCompany] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [editId, setEditId] = useState<string>("");
  const [form, setForm] = useState<{ username: string; fullName: string; email: string; roleId: string; companyId: string; isActive: string; password?: string; confirm?: string }>(() => ({ username: "", fullName: "", email: "", roleId: "", companyId: "", isActive: "1", password: "", confirm: "" }));
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);
  const pageSize = 20;

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const data = await apiFetch("/api/users");
        const r = await apiFetch("/api/roles");
        const c = await apiFetch("/api/companies");
        setItems(Array.isArray(data) ? data : []);
        setRoles(Array.isArray(r) ? r : []);
        setCompanies(Array.isArray(c) ? c : []);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const filtered = useMemo(() => {
    return items
      .filter(it => (qUser ? (it.username + it.fullName).toLowerCase().includes(qUser.toLowerCase()) : true))
      .filter(it => (qCompany ? companies.find(c => c.id === it.companyId)?.name?.toLowerCase().includes(qCompany.toLowerCase()) : true))
      .slice(0, pageSize);
  }, [items, qUser, qCompany, companies]);

  const openAdd = () => {
    setIsEdit(false);
    setEditId("");
    setForm({ username: "", fullName: "", email: "", roleId: "", companyId: "", isActive: "1" });
    setShowForm(true);
  };

  const openEdit = (it: User) => {
    setIsEdit(true);
    setEditId(it.id);
    setForm({ username: it.username, fullName: it.fullName, email: it.email, roleId: it.roleId, companyId: it.companyId, isActive: it.isActive ? "1" : "0", password: "", confirm: "" });
    setShowForm(true);
  };

  const save = async () => {
    setSaving(true);
    try {
      if (!isEdit) {
        if (!form.password || !form.confirm || form.password !== form.confirm) {
          setToast({ msg: "Mật khẩu không hợp lệ hoặc không khớp", type: "error" });
          setSaving(false);
          return;
        }
      }
      const payload: any = { username: form.username, fullName: form.fullName, email: form.email, roleId: form.roleId, companyId: form.companyId, isActive: form.isActive === "1" };
      if (isEdit) {
        const tryingToChange = !!form.password || !!form.confirm;
        if (tryingToChange) {
          if (!form.password || !form.confirm || form.password !== form.confirm) {
            setToast({ msg: "Mật khẩu mới không hợp lệ hoặc không khớp", type: "error" });
            setSaving(false);
            return;
          }
          payload.password = form.password;
        }
      } else {
        payload.password = form.password;
      }
      if (isEdit && editId) {
        await apiFetch(`/api/users/${editId}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      } else {
        await apiFetch(`/api/users`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      }
      const data = await apiFetch("/api/users");
      setItems(Array.isArray(data) ? data : []);
      setShowForm(false);
      setToast({ msg: isEdit ? "Cập nhật người dùng thành công" : "Thêm người dùng thành công", type: "success" });
    } catch (e) {
      setToast({ msg: isEdit ? "Cập nhật người dùng thất bại" : "Thêm người dùng thất bại", type: "error" });
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!isEdit || !editId) return;
    setSaving(true);
    try {
      const token = localStorage.getItem("jwt");
      await fetch(`${API_BASE_URL}/api/users/${editId}`, { method: "DELETE", headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) } });
      const data = await apiFetch("/api/users");
      setItems(Array.isArray(data) ? data : []);
      setShowForm(false);
      setToast({ msg: "Xóa người dùng thành công", type: "success" });
    } catch (e) {
      setToast({ msg: "Xóa người dùng thất bại", type: "error" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Layout>
      <div className="bg-white border rounded-md">
        <div className="p-4 border-b flex items-center justify-between">
          <h2 className="text-xl font-semibold">Người dùng</h2>
          <div className="flex items-center space-x-3">
            <div className="text-sm text-gray-500">Hiển thị {filtered.length} / {items.length}</div>
            <button onClick={openAdd} className="px-3 py-2 bg-blue-600 text-white rounded-md">Thêm mới</button>
          </div>
        </div>
        <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-3 border-b">
          <input className="border rounded px-3 py-2" placeholder="Tìm theo tên/username" value={qUser} onChange={e => setQUser(e.target.value)} />
          <input className="border rounded px-3 py-2" placeholder="Tìm theo công ty" value={qCompany} onChange={e => setQCompany(e.target.value)} />
          <div className="text-sm text-gray-600 flex items-center">{loading ? "Đang tải dữ liệu..." : ""}</div>
        </div>
        <div className="p-0">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="p-2 w-16 text-center">STT</th>
                <th className="p-2 text-left">Tên đầy đủ</th>
                <th className="p-2 text-left">Username</th>
                <th className="p-2 text-left">Email</th>
                <th className="p-2 text-left">Công ty</th>
                <th className="p-2 text-left">Vai trò</th>
                <th className="p-2 text-left">Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (<tr><td className="p-3 text-center text-gray-500" colSpan={7}>Không có dữ liệu</td></tr>)}
              {filtered.map((it, idx) => (
                <tr key={it.id} className="border-t hover:bg-gray-50 cursor-pointer" onClick={() => openEdit(it)}>
                  <td className="p-2 text-center">{idx + 1}</td>
                  <td className="p-2">{it.fullName}</td>
                  <td className="p-2 font-mono text-sm">{it.username}</td>
                  <td className="p-2">{it.email}</td>
                  <td className="p-2">{companies.find(c => c.id === it.companyId)?.name || "-"}</td>
                  <td className="p-2">{roles.find(r => r.id === it.roleId)?.code || "-"}</td>
                  <td className="p-2">{it.isActive ? "Kích hoạt" : "Tạm dừng"}</td>
                </tr>
              ))}
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
              <input className="border rounded px-3 py-2 w-full" placeholder="Tên đầy đủ" value={form.fullName} onChange={e => setForm({ ...form, fullName: e.target.value })} />
              <input className="border rounded px-3 py-2 w-full" placeholder="Username" value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} />
              <input className="border rounded px-3 py-2 w-full" placeholder="Email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
              <select className="border rounded px-3 py-2 w-full" value={form.companyId} onChange={e => setForm({ ...form, companyId: e.target.value })}>
                <option value="">Chọn công ty...</option>
                {companies.map(c => (<option key={c.id} value={c.id}>{c.name}</option>))}
              </select>
              <select className="border rounded px-3 py-2 w-full" value={form.roleId} onChange={e => setForm({ ...form, roleId: e.target.value })}>
                <option value="">Chọn vai trò...</option>
                {roles.map(r => (<option key={r.id} value={r.id}>{r.code}</option>))}
              </select>
              <select className="border rounded px-3 py-2 w-full" value={form.isActive} onChange={e => setForm({ ...form, isActive: e.target.value })}>
                <option value="1">Kích hoạt</option>
                <option value="0">Tạm dừng</option>
              </select>
              <input type="password" className="border rounded px-3 py-2 w-full" placeholder={isEdit ? "Mật khẩu mới (tùy chọn)" : "Mật khẩu"} value={form.password || ""} onChange={e => setForm({ ...form, password: e.target.value })} />
              <input type="password" className="border rounded px-3 py-2 w-full" placeholder={isEdit ? "Xác nhận mật khẩu mới" : "Xác nhận mật khẩu"} value={form.confirm || ""} onChange={e => setForm({ ...form, confirm: e.target.value })} />
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
            <div className="p-4 text-gray-700">Bạn có chắc muốn xóa người dùng này?</div>
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
