import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { useSidebarStore } from '@/stores/sidebarStore';
import AdminSidebar from './AdminSidebar';
import ContractSidebar from './ContractSidebar';

interface MobileSidebarProps {
  userRole: 'admin' | 'user';
}

export default function MobileSidebar({ userRole }: MobileSidebarProps) {
  const { isMobileOpen, activeSection, setMobileOpen } = useSidebarStore();

  useEffect(() => {
    if (isMobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMobileOpen]);

  if (!isMobileOpen) return null;

  const renderSidebar = () => {
    if (userRole === 'admin') {
      return activeSection === 'admin' ? (
        <AdminSidebar isCollapsed={false} onToggle={() => setMobileOpen(false)} />
      ) : (
        <ContractSidebar isCollapsed={false} onToggle={() => setMobileOpen(false)} />
      );
    }

    return <ContractSidebar isCollapsed={false} onToggle={() => setMobileOpen(false)} />;
  };

  return createPortal(
    <div className="fixed inset-0 z-50 lg:hidden">
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={() => setMobileOpen(false)}
      />
      <div className="fixed left-0 top-0 h-full w-64 bg-white shadow-xl transform transition-transform duration-300 ease-in-out">
        <div className="absolute top-4 right-4 z-10">
          <button
            onClick={() => setMobileOpen(false)}
            className="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
            aria-label="Đóng menu"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        {renderSidebar()}
      </div>
    </div>,
    document.body
  );
}