import { useEffect } from 'react';
import { useSidebarStore } from '@/stores/sidebarStore';
import { SidebarContainerProps } from '@/types/sidebar';
import AdminSidebar from './AdminSidebar';
import ContractSidebar from './ContractSidebar';

export default function SidebarContainer({ userRole, onSectionChange, className = '' }: SidebarContainerProps) {
  const { activeSection, setActiveSection, isCollapsed, toggleCollapsed, setCollapsed } = useSidebarStore();

  useEffect(() => {
    if (onSectionChange) {
      onSectionChange(activeSection);
    }
  }, [activeSection, onSectionChange]);

  useEffect(() => {
    const mql = window.matchMedia('(max-width: 1023px)');
    const applyCollapse = (e: MediaQueryListEvent | MediaQueryList) => {
      setCollapsed(e.matches);
    };
    applyCollapse(mql);
    const handler = (e: MediaQueryListEvent) => applyCollapse(e);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, [setCollapsed]);

  const handleSectionChange = (section: 'admin' | 'contracts') => {
    setActiveSection(section);
  };

  const renderSidebar = () => {
    if (userRole === 'admin') {
      return activeSection === 'admin' ? (
        <AdminSidebar 
          isCollapsed={isCollapsed} 
          onToggle={toggleCollapsed}
          className={className}
        />
      ) : (
        <ContractSidebar 
          isCollapsed={isCollapsed} 
          onToggle={toggleCollapsed}
          className={className}
        />
      );
    }

    return (
      <ContractSidebar 
        isCollapsed={isCollapsed} 
        onToggle={toggleCollapsed}
        className={className}
      />
    );
  };

  return (
    <>
      {renderSidebar()}
      
      {userRole === 'admin' && (
        <div className="fixed bottom-4 left-4 z-50">
          <button
            onClick={() => handleSectionChange(activeSection === 'admin' ? 'contracts' : 'admin')}
            className="p-3 rounded-full shadow-lg bg-white border border-gray-200 hover:bg-gray-50 transition-colors"
            aria-label={`Chuyển sang ${activeSection === 'admin' ? 'quản lý hợp đồng' : 'quản trị'}`}
          >
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${
                activeSection === 'admin' ? 'bg-blue-500' : 'bg-green-500'
              }`} />
              <span className="text-sm font-medium text-gray-700">
                {activeSection === 'admin' ? 'Quản trị' : 'Hợp đồng'}
              </span>
            </div>
          </button>
        </div>
      )}
    </>
  );
}
