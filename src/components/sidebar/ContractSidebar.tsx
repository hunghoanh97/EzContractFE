import { Link, useLocation } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Home, FileText, Settings, Wrench, PlusCircle, GitBranch, Menu } from 'lucide-react';
import { ContractSidebarProps } from '@/types/sidebar';
import { useSidebarStore } from '@/stores/sidebarStore';

const contractItems = [
  { path: '/', label: 'Trang chủ', icon: Home },
  { path: '/contracts/pending', label: 'Hợp đồng chờ xử lý', icon: FileText },
  { path: '/contract-templates', label: 'Mẫu hợp đồng', icon: FileText },
  { path: '/create-contract', label: 'Tạo hợp đồng', icon: PlusCircle },
  { path: '/workflow', label: 'Tiến độ workflow', icon: GitBranch },
];

export default function ContractSidebar({ isCollapsed, onToggle, className = '' }: ContractSidebarProps) {
  const { pathname } = useLocation();
  const { theme } = useSidebarStore();

  const sidebarWidth = isCollapsed ? 'w-16' : 'w-64';
  const iconSize = isCollapsed ? 'w-6 h-6' : 'w-5 h-5';

  return (
    <aside 
      className={`${sidebarWidth} bg-white border-r h-screen sticky top-0 transition-all duration-300 ease-in-out ${className}`}
      style={{ 
        borderColor: theme.border,
        '--sidebar-primary': theme.primary,
        '--sidebar-secondary': theme.secondary,
        '--sidebar-hover': theme.hover,
        '--sidebar-active': theme.active,
        '--sidebar-text': theme.text,
      } as React.CSSProperties}
    >
      <div className="p-4 border-b flex items-center justify-between" style={{ borderColor: theme.border }}>
        {!isCollapsed && (
          <div>
            <h2 className="text-xl font-bold" style={{ color: theme.primary }}>ezContract</h2>
            <p className="text-xs text-gray-500">Quản lý hợp đồng</p>
          </div>
        )}
        <button
          onClick={onToggle}
          className="p-2 rounded-md hover:bg-gray-100 transition-colors"
          aria-label={isCollapsed ? 'Mở rộng sidebar' : 'Thu gọn sidebar'}
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      <nav className="p-2 space-y-1">
        <div className="px-3 py-2">
          {!isCollapsed && (
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              Quản lý hợp đồng
            </h3>
          )}
          {contractItems.map((item) => {
            const active = pathname === item.path;
            const Icon = item.icon;
            
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center px-3 py-2 rounded-md text-sm transition-colors ${
                  active 
                    ? 'bg-green-50 text-green-700 border border-green-200' 
                    : 'text-gray-700 hover:bg-green-50'
                } ${isCollapsed ? 'justify-center' : 'justify-start'}`}
                title={isCollapsed ? item.label : ''}
              >
                <Icon className={iconSize} />
                {!isCollapsed && <span className="ml-3">{item.label}</span>}
              </Link>
            );
          })}
        </div>
      </nav>

      <div className="absolute bottom-4 left-4 right-4">
        <button
          onClick={() => {
            const { setActiveSection } = useSidebarStore.getState();
            setActiveSection('admin');
          }}
          className={`w-full flex items-center px-3 py-2 rounded-md text-sm text-gray-600 hover:bg-green-50 transition-colors ${
            isCollapsed ? 'justify-center' : 'justify-start'
          }`}
          title={isCollapsed ? 'Chuyển sang quản trị' : ''}
        >
          <Menu className={iconSize} />
          {!isCollapsed && <span className="ml-3">Chuyển sang Quản trị</span>}
        </button>
      </div>
    </aside>
  );
}
