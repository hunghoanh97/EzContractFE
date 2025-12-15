import { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import ConfirmDialog from '@/components/ConfirmDialog';
import WorkflowPopup from '@/components/WorkflowPopup';
import { apiFetch } from '@/services/api';
import { Download, Search, FileText, Calendar, User, Building, Trash } from 'lucide-react';

interface PendingContract {
  id: string;
  company_name: string;
  creator_name: string;
  creator_email: string;
  contract_number: string;
  file_id: string;
  created_at: string;
  status: string;
}

interface PendingContractsResponse {
  data: PendingContract[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export default function PendingContractsPage() {
  const [contracts, setContracts] = useState<PendingContract[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [sortBy, setSortBy] = useState<string>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [downloading, setDownloading] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [confirmTarget, setConfirmTarget] = useState<PendingContract | null>(null);
  const [workflowPopupFor, setWorkflowPopupFor] = useState<PendingContract | null>(null);

  const limit = 10;

  const fetchPendingContracts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: limit.toString(),
        ...(searchTerm && { search: searchTerm }),
        ...(sortBy && { sortBy }),
        sortOrder
      });

      const response = await apiFetch(`/api/contracts/pending?${params}`);
      const data: PendingContractsResponse = response;
      
      setContracts(data.data);
      setTotalPages(data.totalPages);
    } catch (error) {
      console.error('Error fetching pending contracts:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingContracts();
  }, [currentPage, searchTerm, sortBy, sortOrder]);

  const handleDownload = async (contract: PendingContract, fileName?: string) => {
    try {
      setDownloading(contract.id + (fileName || ''));
      const token = (await import('@/services/authService')).getAccessTokenAuto ? await (await import('@/services/authService')).getAccessTokenAuto() : null;
      const urlParams = fileName ? `?file=${encodeURIComponent(fileName)}` : '';
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL || ''}/api/contracts/${contract.id}/download${urlParams}`, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      });
      if (!res.ok) throw new Error(`API error ${res.status}`);
      const blob = await res.blob();
      const cd = res.headers.get('content-disposition') || '';
      const m = /filename="?([^";]+)"?/i.exec(cd);
      
      let fname = m ? m[1] : (fileName || (contract.file_id || 'document.docx'));
      if (!fileName && !m && contract.file_id && contract.file_id.trim().startsWith('[')) fname = `contract_${contract.contract_number}.zip`;

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fname;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (e: any) {
      const msg = String(e?.message || e);
      if (!(msg.includes('NETWORK_ABORTED') || msg.includes('ERR_ABORTED'))) {
        console.error('Error downloading file:', e);
      }
    } finally {
      setDownloading(null);
    }
  };

  const parseFiles = (fileId: string | null | undefined) => {
    if (!fileId) return [];
    try {
        if (fileId.trim().startsWith('[')) {
            const parsed = JSON.parse(fileId);
            if (Array.isArray(parsed)) return parsed.filter(x => x && typeof x === 'string');
        }
    } catch {}
    return [fileId];
  };


  const handleDelete = (contract: PendingContract) => {
    if ((contract.status || '').toLowerCase() !== 'draft') return;
    setConfirmTarget(contract);
  };

  const confirmDelete = async () => {
    if (!confirmTarget) return;
    try {
      setDeleting(confirmTarget.id);
      await apiFetch(`/api/contracts/${confirmTarget.id}`, { method: 'DELETE' });
      await fetchPendingContracts();
    } catch (e: any) {
      // Ignore abort errors which might happen on unmount or network blips
      const code = (e && (e as any).code) || '';
      const msg = String(e?.message || e);
      if (!(code === 'NETWORK_ABORTED' || msg.includes('NETWORK_ABORTED') || msg.includes('ERR_ABORTED'))) {
        console.error('Error deleting contract:', e);
      }
    } finally {
      setDeleting(null);
      setConfirmTarget(null);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchPendingContracts();
  };

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Layout>
      <div className="bg-gray-50 p-0">
        <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Hợp đồng chờ xử lý</h1>
                <p className="text-gray-600 mt-1">Danh sách các hợp đồng đang chờ xử lý trong hệ thống</p>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <FileText className="w-4 h-4" />
                <span>{contracts.length} hợp đồng</span>
              </div>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="px-6 py-4 border-b border-gray-200">
            <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Tìm kiếm theo tên công ty, người tạo, số hợp đồng..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <button
                type="submit"
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
              >
                Tìm kiếm
              </button>
            </form>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <button
                      onClick={() => handleSort('contract_number')}
                      className="flex items-center space-x-1 hover:text-gray-700"
                    >
                      <span>Số hợp đồng</span>
                      {sortBy === 'contract_number' && (
                        <span className="text-blue-600">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </button>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    File đính kèm
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <button
                      onClick={() => handleSort('company')}
                      className="flex items-center space-x-1 hover:text-gray-700"
                    >
                      <span>Công ty</span>
                      {sortBy === 'company' && (
                        <span className="text-blue-600">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </button>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <button
                      onClick={() => handleSort('creator')}
                      className="flex items-center space-x-1 hover:text-gray-700"
                    >
                      <span>Người tạo</span>
                      {sortBy === 'creator' && (
                        <span className="text-blue-600">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </button>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <button
                      onClick={() => handleSort('created_at')}
                      className="flex items-center space-x-1 hover:text-gray-700"
                    >
                      <span>Ngày tạo</span>
                      {sortBy === 'created_at' && (
                        <span className="text-blue-600">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </button>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Trạng thái
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center">
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        <span className="ml-2 text-gray-500">Đang tải dữ liệu...</span>
                      </div>
                    </td>
                  </tr>
                ) : contracts.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                      <FileText className="w-12 h-12 mx-auto text-gray-300 mb-2" />
                      <p>Không tìm thấy hợp đồng nào chờ xử lý</p>
                    </td>
                  </tr>
                ) : (
                  contracts.map((contract) => (
                    <tr key={contract.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{contract.contract_number}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                         <div className="flex flex-col space-y-1">
                            {parseFiles(contract.file_id).map((f, i) => (
                                <div key={i} className="flex items-center space-x-2">
                                    <span className="text-sm text-gray-600 truncate max-w-[150px]" title={f}>
                                        {f && f.includes('_') ? f.substring(f.indexOf('_') + 1) : f}
                                    </span>
                                    <button 
                                        onClick={() => handleDownload(contract, f)}
                                        disabled={downloading === contract.id + f}
                                        className="text-blue-600 hover:text-blue-800 text-xs"
                                    >
                                        {downloading === contract.id + f ? '...' : '[Tải]'}
                                    </button>
                                </div>
                            ))}
                         </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Building className="w-4 h-4 text-gray-400 mr-2" />
                          <div className="text-sm text-gray-900">{contract.company_name}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <User className="w-4 h-4 text-gray-400 mr-2" />
                          <div>
                            <div className="text-sm text-gray-900">{contract.creator_name}</div>
                            <div className="text-xs text-gray-500">{contract.creator_email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 text-gray-400 mr-2" />
                          <div className="text-sm text-gray-900">{formatDate(contract.created_at)}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          contract.status === 'pending' 
                            ? 'bg-yellow-100 text-yellow-800' 
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {contract.status === 'pending' ? 'Chờ xử lý' : 'Bản nháp'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleDownload(contract)}
                            disabled={downloading === contract.id}
                            className="inline-flex items-center px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {downloading === contract.id ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-1"></div>
                            ) : (
                              <Download className="w-4 h-4 mr-1" />
                            )}
                            {parseFiles(contract.file_id).length > 1 ? 'Tải Zip' : 'Tải file'}
                          </button>
                          <button
                            onClick={() => handleDelete(contract)}
                            disabled={deleting === contract.id || (contract.status || '').toLowerCase() !== 'draft'}
                            className="inline-flex items-center px-3 py-1 border border-red-300 rounded-md text-sm font-medium text-red-700 bg-red-50 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {deleting === contract.id ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600 mr-1"></div>
                            ) : (
                              <Trash className="w-4 h-4 mr-1" />
                            )}
                            Xóa
                          </button>
                          <button
                            onClick={() => setWorkflowPopupFor(contract)}
                            className="inline-flex items-center px-3 py-1 border border-blue-300 rounded-md text-sm font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                          >
                            Xử lý
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-6 py-4 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-500">
                  Hiển thị {((currentPage - 1) * limit) + 1} đến {Math.min(currentPage * limit, contracts.length + (currentPage - 1) * limit)} của {contracts.length} kết quả
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Trước
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-3 py-2 text-sm border rounded-md ${
                        currentPage === page
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'border-gray-300 hover:bg-gray-50 text-gray-700'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Sau
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
        </div>
      </div>
      <ConfirmDialog
        open={!!confirmTarget}
        title="Xác nhận xóa hợp đồng"
        message={confirmTarget ? `Bạn có chắc muốn xóa hợp đồng ${confirmTarget.contract_number}?` : ''}
        confirmText="Xóa"
        cancelText="Hủy"
        onConfirm={confirmDelete}
        onCancel={() => setConfirmTarget(null)}
      />
      <WorkflowPopup
        open={!!workflowPopupFor}
        onClose={() => setWorkflowPopupFor(null)}
        contractId={workflowPopupFor?.id || ''}
      />
    </Layout>
  );
}
