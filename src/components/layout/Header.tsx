import { Menu } from 'lucide-react';
import { useSidebarStore } from '@/stores/sidebarStore';

interface HeaderProps {
  userRole: 'admin' | 'user';
  userName?: string;
}

export default function Header({ userRole, userName = 'Người dùng' }: HeaderProps) {
  const { toggleMobile } = useSidebarStore();

  return (
    <header className="bg-white border-b border-gray-200 px-4 py-3 lg:hidden">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={toggleMobile}
            className="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
            aria-label="Mở menu"
          >
            <Menu className="w-6 h-6" />
          </button>
          <div>
            <h1 className="text-lg font-semibold text-gray-900">ezContract</h1>
            <p className="text-sm text-gray-500">
              {userRole === 'admin' ? 'Quản trị hệ thống' : 'Quản lý hợp đồng'}
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <div className="text-right">
            <p className="text-sm font-medium text-gray-900">{userName}</p>
            <p className="text-xs text-gray-500">
              {userRole === 'admin' ? 'Quản trị viên' : 'Người dùng'}
            </p>
          </div>
          <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
            <span className="text-sm font-medium text-gray-600">
              {userName.charAt(0).toUpperCase()}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}